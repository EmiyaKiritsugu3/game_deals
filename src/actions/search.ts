'use server';

import * as Sentry from '@sentry/nextjs';
import { indexGamesBatch, searchGames as typesenseSearch } from '@/lib/typesense';
import type { CheapSharkDeal } from '@/lib/typesense-map';
import { mapDealsToTypesenseGames } from '@/lib/typesense-map';

interface TypesenseHit {
  document: {
    gameID: string;
    title: string;
    thumb: string;
    cheapest: string;
  };
}

/**
 * Search jogos via Typesense
 * Fallback pra CheapShark API se Typesense não configurado
 */
export async function searchGamesAction(query: string, limit = 10) {
  const apiKey =
    process.env.TYPESENSE_ADMIN_KEY || process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '';

  if (!apiKey) {
    // Fallback: CheapShark API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=${limit}`,
        { headers: { 'User-Agent': 'GameDeals/1.0' }, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) return [];
      return (await res.json()) as Array<Record<string, string>>;
    } catch (e) {
      clearTimeout(timeout);
      Sentry.captureException(e instanceof Error ? e : new Error(String(e)));
      return [];
    }
  }

  try {
    const hits = (await typesenseSearch(query, limit)) as unknown as TypesenseHit[];
    return hits.map((hit) => ({
      gameID: hit.document.gameID,
      external: hit.document.title,
      thumb: hit.document.thumb,
      cheapest: hit.document.cheapest,
    }));
  } catch (e) {
    console.error('searchGamesAction error:', e);
    return [];
  }
}

async function fetchDealsForSync(): Promise<CheapSharkDeal[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
      { headers: { 'User-Agent': 'GameDeals/1.0' }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    return (await res.json()) as CheapSharkDeal[];
  } catch (e) {
    clearTimeout(timeout);
    console.error('fetchDealsForSync error:', e);
    return [];
  }
}

/**
 * Sync jogos do CheapShark pra Typesense
 * Chamado pelo cron job
 */
export async function syncGamesToTypesenseAction(): Promise<{
  success: boolean;
  indexed: number;
  error?: string;
}> {
  const apiKey = process.env.TYPESENSE_ADMIN_KEY || '';
  if (!apiKey) {
    return { success: false, indexed: 0, error: 'Typesense not configured' };
  }
  try {
    const deals = await fetchDealsForSync();
    if (deals.length === 0) {
      return { success: false, indexed: 0, error: 'No deals fetched' };
    }
    const games = mapDealsToTypesenseGames(deals);
    const ok = await indexGamesBatch(games);
    return { success: ok, indexed: games.length };
  } catch (error) {
    return {
      success: false,
      indexed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
