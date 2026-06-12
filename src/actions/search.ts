'use server';

import { TYPESENSE_CONFIG, searchGames as typesenseSearch, indexGamesBatch, GAME_SCHEMA } from '@/lib/typesense';

/**
 * Search jogos via Typesense
 * Fallback pra CheapShark API se Typesense não configurado
 */
export async function searchGamesAction(query: string, limit = 10) {
  if (!TYPESENSE_CONFIG.apiKey) {
    // Fallback: CheapShark API
    const res = await fetch(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=${limit}`
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
    console.error("searchGamesAction error:", e);
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
  if (!TYPESENSE_CONFIG.apiKey) {
    return { success: false, indexed: 0, error: 'Typesense not configured' };
  }

  try {
    // Buscar deals do CheapShark
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100'
    );

    if (!res.ok) {
      return { success: false, indexed: 0, error: `CheapShark error: ${res.status}` };
    }

    const deals = await res.json();

    // Mapear pra formato Typesense
    const games = deals.map((deal: any) => ({
      gameID: deal.gameID,
      title: deal.title,
      thumb: deal.thumb,
      cheapest: deal.salePrice,
      metacriticScore: parseInt(deal.metacriticScore) || 0,
      steamRating: parseInt(deal.steamRatingPercent) || 0,
    }));

    // Batch index com upsert (usa gameID como doc id)
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
  if (!TYPESENSE_CONFIG.apiKey) return false;

  const url = `${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}`;

  try {
    const response = await fetch(`${url}/collections`, {
      method: 'POST',
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GAME_SCHEMA),
    });

    return response.ok || response.status === 409; // 409 = already exists
  } catch (e) {
    console.error("createTypesenseCollection error:", e);
    return false;
  }
}
