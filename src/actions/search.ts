'use server';

import { searchGames as typesenseSearch, indexGamesBatch, GAME_SCHEMA } from '@/lib/typesense';

/**
 * Search jogos via Typesense
 * Fallback pra CheapShark API se Typesense não configurado
 */
export async function searchGamesAction(query: string, limit = 10) {
  const apiKey = process.env.TYPESENSE_ADMIN_KEY || process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '';

  if (!apiKey) {
    // Fallback: CheapShark API
    const res = await fetch(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!res.ok) return [];
    return res.json();
  }

  try {
    const hits = await typesenseSearch(query, limit);
    return hits.map((hit: any) => ({
      gameID: hit.document.gameID,
      external: hit.document.title,
      thumb: hit.document.thumb,
      cheapest: hit.document.cheapest,
      cheapestPrice: hit.document.cheapestPrice,
    }));
  } catch (e) {
    console.error('searchGamesAction error:', e);
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
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
    );

    if (!res.ok) {
      return { success: false, indexed: 0, error: `CheapShark error: ${res.status}` };
    }

    const deals = await res.json();

    const games = deals.map((deal: any) => ({
      gameID: deal.gameID,
      title: deal.title,
      thumb: deal.thumb,
      cheapest: deal.salePrice,
      metacriticScore: parseInt(deal.metacriticScore) || 0,
      steamRating: parseInt(deal.steamRatingPercent) || 0,
    }));

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

/**
 * Criar collection Typesense (setup inicial)
 */
export async function createTypesenseCollectionAction(): Promise<boolean> {
  const host = process.env.TYPESENSE_HOST || 'localhost';
  const port = parseInt(process.env.TYPESENSE_PORT || '443');
  const protocol = process.env.TYPESENSE_PROTOCOL || 'https';
  const apiKey = process.env.TYPESENSE_ADMIN_KEY || '';
  if (!apiKey) return false;

  const url = `${protocol}://${host}:${port}`;

  try {
    const response = await fetch(`${url}/collections`, {
      method: 'POST',
      headers: {
        'X-TYPESENSE-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GAME_SCHEMA),
    });

    return response.ok || response.status === 409;
  } catch (e) {
    console.error('createTypesenseCollection error:', e);
    return false;
  }
}
