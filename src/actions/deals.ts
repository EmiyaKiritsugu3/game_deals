'use server';

import { db } from '@/db';
import { games, deals as dealsTable, priceHistory } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal, GameDetails, Store } from '@/types/game';

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
  // Validate inputs
  const ALLOWED_SORT = ['Deal Rating', 'Title', 'Savings', 'Price'] as const;
  const sortBy = params?.sortBy && ALLOWED_SORT.includes(params.sortBy as typeof ALLOWED_SORT[number])
    ? params.sortBy
    : 'Deal Rating';
  const pageSizeRaw = params?.pageSize ? Number.parseInt(params.pageSize, 10) : 20;
  const pageSize = Math.max(1, Math.min(100, Number.isNaN(pageSizeRaw) ? 20 : pageSizeRaw));

  const url = new URL(`${BASE_URL}/deals`);
  url.searchParams.append('sortBy', sortBy);
  url.searchParams.append('onSale', params?.onSale ?? '1');
  url.searchParams.append('pageSize', String(pageSize));

  if (params?.upperPrice && !Number.isNaN(Number(params.upperPrice))) url.searchParams.append('upperPrice', params.upperPrice);
  if (params?.lowerPrice && !Number.isNaN(Number(params.lowerPrice))) url.searchParams.append('lowerPrice', params.lowerPrice);
  if (params?.storeID && /^\d{1,3}$/.test(params.storeID)) url.searchParams.append('storeID', params.storeID);
  if (params?.title && params.title.length <= 200) url.searchParams.append('title', encodeURIComponent(params.title));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return fallbackDeals;
    const data: Deal[] = await res.json();
    return data.length > 0 ? data : fallbackDeals;
  } catch (e) {
    console.error("getDealsAction error:", e);
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
  } catch (e) {
    console.error("getGameAction error:", e);
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
  } catch (e) {
    console.error("getStoresAction error:", e);
  }

  map['101'] = 'CDKeys';
  map['102'] = 'Kinguin';
  map['103'] = 'Eneba';
  map['104'] = 'Gamivo';

  return map;
}

/**
 * Server Actions — wrappers finos sobre CheapShark API.
 * Para lógica de negócio (keyshops, DRM, pricing), use services/api.ts.
 */

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

      await db.insert(games).values({
        id: gameId,
        title: deal.title,
        cheapsharkId: deal.gameID,
        thumbUrl: deal.thumb,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: games.cheapsharkId,
        set: { title: deal.title, thumbUrl: deal.thumb, updatedAt: new Date() },
      });
      gamesUpserted++;
    }

    // Batch inserts for deals + price_history
    if (deals.length > 0) {
      const dealsValues = deals.map((d: any) => ({
        gameId: d.gameID,
        storeId: d.storeID,
        price: Number.parseFloat(d.salePrice),
        retailPrice: Number.parseFloat(d.normalPrice),
        savings: Number.parseFloat(d.savings),
        dealRating: d.dealRating ? Number.parseFloat(d.dealRating) : null,
        url: 'https://www.cheapshark.com/redirect?dealID=' + d.dealID,
        createdAt: new Date(),
      }));
      await db.insert(dealsTable).values(dealsValues);
      dealsIngested = dealsValues.length;

      const priceValues = deals.map((d: any) => ({
        gameId: d.gameID,
        storeId: d.storeID,
        price: Number.parseFloat(d.salePrice),
        retailPrice: Number.parseFloat(d.normalPrice),
        recordedAt: new Date(),
      }));
      // Insert em lotes de 50 para evitar payload muito grande
      for (let i = 0; i < priceValues.length; i += 50) {
        await db.insert(priceHistory).values(priceValues.slice(i, i + 50));
      }
      pricesRecorded = priceValues.length;
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
    const rows = await db.execute(
      sql`SELECT * FROM get_daily_prices(${gameId}, ${days})`
    );
    return rows;
  } catch (e) {
    console.error("getDailyPriceHistory error:", e);
    return [];
  }
}

/**
 * Busca preço histórico semanal de um jogo
 */
export async function getWeeklyPriceHistoryAction(gameId: string, weeks = 26) {
  try {
    const rows = await db.execute(
      sql`SELECT * FROM get_weekly_prices(${gameId}, ${weeks})`
    );
    return rows;
  } catch (e) {
    console.error("getWeeklyPriceHistory error:", e);
    return [];
  }
}

/**
 * Busca deals do banco
 */
export async function getDealsFromDBAction(limit = 20) {
  const result = await db.select({
    gameId: dealsTable.gameId,
    title: games.title,
    storeId: dealsTable.storeId,
    price: dealsTable.price,
    retailPrice: dealsTable.retailPrice,
    savings: dealsTable.savings,
    dealRating: dealsTable.dealRating,
    thumbUrl: games.thumbUrl,
  }).from(dealsTable)
    .innerJoin(games, eq(games.id, dealsTable.gameId))
    .orderBy(desc(dealsTable.dealRating))
    .limit(limit);

  return result;
}
