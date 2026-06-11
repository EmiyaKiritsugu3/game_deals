'use server';

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal, GameDetails, Store } from '@/types/game';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 10 });

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * Busca deals da CheapShark (com fallback)
 */
export async function getDealsAction(params?: {
  sortBy?: string;
  onSale?: string;
  pageSize?: string;
  upperPrice?: string;
  lowerPrice?: string;
  storeID?: string;
  title?: string;
}): Promise<Deal[]> {
  const url = new URL(`${BASE_URL}/deals`);
  url.searchParams.append('sortBy', params?.sortBy ?? 'Deal Rating');
  url.searchParams.append('onSale', params?.onSale ?? '1');
  url.searchParams.append('pageSize', params?.pageSize ?? '20');

  if (params?.upperPrice) url.searchParams.append('upperPrice', params.upperPrice);
  if (params?.lowerPrice) url.searchParams.append('lowerPrice', params.lowerPrice);
  if (params?.storeID) url.searchParams.append('storeID', params.storeID);
  if (params?.title) url.searchParams.append('title', params.title);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return fallbackDeals;
    const data: Deal[] = await res.json();
    return data.length > 0 ? data : fallbackDeals;
  } catch {
    return fallbackDeals;
  }
}

/**
 * Busca detalhes de um jogo
 */
export async function getGameAction(id: string): Promise<GameDetails | null> {
  const url = new URL(`${BASE_URL}/games`);
  url.searchParams.append('id', id);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Busca lista de lojas
 */
export async function getStoresAction(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  try {
    const res = await fetch(`${BASE_URL}/stores`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const stores: Store[] = await res.json();
      stores.forEach((s) => (map[s.storeID] = s.storeName));
    }
  } catch {
    // fallback vazio
  }

  map['101'] = 'CDKeys';
  map['102'] = 'Kinguin';
  map['103'] = 'Eneba';
  map['104'] = 'Gamivo';

  return map;
}

/**
 * Search jogos por título
 */
export async function searchGamesAction(title: string): Promise<Deal[]> {
  if (!title || title.length < 2) return [];

  const url = new URL(`${BASE_URL}/games`);
  url.searchParams.append('title', title);
  url.searchParams.append('limit', '10');
  url.searchParams.append('exact', '0');

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Ingestão de preços — busca deals e salva no banco + price_history
 */
export async function ingestPricesAction(): Promise<{
  success: boolean;
  dealsIngested: number;
  gamesUpserted: number;
  pricesRecorded: number;
  error?: string;
}> {
  try {
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return { success: false, dealsIngested: 0, gamesUpserted: 0, pricesRecorded: 0, error: `CheapShark API error: ${res.status}` };
    }

    const deals = await res.json();
    if (!deals || deals.length === 0) {
      return { success: true, dealsIngested: 0, gamesUpserted: 0, pricesRecorded: 0 };
    }

    let gamesUpserted = 0;
    let dealsIngested = 0;
    let pricesRecorded = 0;

    const uniqueGameIds = [...new Set(deals.map((d: any) => d.gameID))];

    for (const gameId of uniqueGameIds as string[]) {
      const deal = deals.find((d: any) => d.gameID === gameId);
      if (!deal) continue;

      await sql`
        INSERT INTO games (id, title, "cheapsharkId", "thumbUrl", "createdAt", "updatedAt")
        VALUES (${gameId}::uuid, ${deal.title}, ${deal.gameID}, ${deal.thumb}, NOW(), NOW())
        ON CONFLICT ("cheapsharkId") DO UPDATE SET
          title = ${deal.title},
          "thumbUrl" = ${deal.thumb},
          "updatedAt" = NOW()
      `;
      gamesUpserted++;
    }

    for (const deal of deals as any[]) {
      await sql`
        INSERT INTO deals ("gameId", "storeId", price, "retailPrice", savings, "dealRating", url, "createdAt")
        VALUES (
          ${deal.gameID}::uuid,
          ${deal.storeID},
          ${deal.salePrice}::real,
          ${deal.normalPrice}::real,
          ${deal.savings}::real,
          ${deal.dealRating}::real,
          ${'https://www.cheapshark.com/redirect?dealID=' + deal.dealID},
          NOW()
        )
      `;
      dealsIngested++;

      // Registrar preço no histórico
      await sql`
        INSERT INTO price_history ("gameId", "storeId", price, "retailPrice", "recordedAt")
        VALUES (
          ${deal.gameID}::uuid,
          ${deal.storeID},
          ${deal.salePrice}::real,
          ${deal.normalPrice}::real,
          NOW()
        )
      `;
      pricesRecorded++;
    }

    return { success: true, dealsIngested, gamesUpserted, pricesRecorded };
  } catch (error) {
    console.error('Ingest error:', error);
    return {
      success: false,
      dealsIngested: 0,
      gamesUpserted: 0,
      pricesRecorded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Busca preço histórico diário de um jogo
 */
export async function getDailyPriceHistoryAction(gameId: string, days = 90) {
  try {
    const rows = await sql`
      SELECT * FROM get_daily_prices(${gameId}, ${days})
    `;
    return rows;
  } catch {
    return [];
  }
}

/**
 * Busca preço histórico semanal de um jogo
 */
export async function getWeeklyPriceHistoryAction(gameId: string, weeks = 26) {
  try {
    const rows = await sql`
      SELECT * FROM get_weekly_prices(${gameId}, ${weeks})
    `;
    return rows;
  } catch {
    return [];
  }
}

/**
 * Busca deals do banco
 */
export async function getDealsFromDBAction(limit = 20) {
  const deals = await sql`
    SELECT
      d."gameId",
      g.title,
      d."storeId",
      d.price,
      d."retailPrice",
      d.savings,
      d."dealRating",
      g."thumbUrl"
    FROM deals d
    JOIN games g ON g.id = d."gameId"
    ORDER BY d."dealRating" DESC
    LIMIT ${limit}
  `;

  return deals as unknown as any[];
}
