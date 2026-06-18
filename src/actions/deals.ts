'use server';

import * as Sentry from '@sentry/nextjs';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { deals as dealsTable, games, priceHistory } from '@/db/schema';
import { fetchDealsWithFallback, fetchGameDetails } from '@/services/fetch-helpers';
import {
  buildDealsInsertValues,
  buildPriceHistoryValues,
  type CheapSharkDeal,
  fetchCheapSharkDeals,
  upsertGames,
} from '@/services/ingest';
import type { Deal, GameDetails, Store } from '@/types/game';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

const ALLOWED_SORT = ['Deal Rating', 'Title', 'Savings', 'Price'] as const;

function validateSortBy(input?: string): string {
  if (!input) return 'Deal Rating';
  return ALLOWED_SORT.includes(input as (typeof ALLOWED_SORT)[number]) ? input : 'Deal Rating';
}

function validatePageSize(input?: string): number {
  if (!input) return 20;
  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.max(1, Math.min(100, parsed));
}

function isValidPrice(input?: string): boolean {
  return input !== undefined && !Number.isNaN(Number(input));
}

function isValidStoreId(input?: string): boolean {
  return input !== undefined && /^\d{1,3}$/.test(input);
}

function sanitizeTitle(input?: string): string | undefined {
  if (!input || input.length > 200) return undefined;
  return encodeURIComponent(input);
}

function buildDealsUrl(params: {
  sortBy: string;
  onSale: string;
  pageSize: number;
  upperPrice?: string;
  lowerPrice?: string;
  storeID?: string;
  title?: string;
}): URL {
  const url = new URL(`${BASE_URL}/deals`);
  url.searchParams.append('sortBy', params.sortBy);
  url.searchParams.append('onSale', params.onSale);
  url.searchParams.append('pageSize', String(params.pageSize));
  if (params.upperPrice) url.searchParams.append('upperPrice', params.upperPrice);
  if (params.lowerPrice) url.searchParams.append('lowerPrice', params.lowerPrice);
  if (params.storeID) url.searchParams.append('storeID', params.storeID);
  if (params.title) url.searchParams.append('title', params.title);
  return url;
}

// (fetchDealsWithFallback moved to services/fetch-helpers.ts)

function sanitizeDealParams(params?: {
  sortBy?: string;
  onSale?: string;
  pageSize?: string;
  upperPrice?: string;
  lowerPrice?: string;
  storeID?: string;
  title?: string;
}) {
  return {
    sortBy: validateSortBy(params?.sortBy),
    onSale: params?.onSale ?? '1',
    pageSize: validatePageSize(params?.pageSize),
    upperPrice: isValidPrice(params?.upperPrice) ? params?.upperPrice : undefined,
    lowerPrice: isValidPrice(params?.lowerPrice) ? params?.lowerPrice : undefined,
    storeID: isValidStoreId(params?.storeID) ? params?.storeID : undefined,
    title: sanitizeTitle(params?.title),
  };
}

/**
 * Busca deals da CheapShark (com fallback)
 */
// fallow-ignore-next-line unused-export
export async function getDealsAction(params?: {
  sortBy?: string;
  onSale?: string;
  pageSize?: string;
  upperPrice?: string;
  lowerPrice?: string;
  storeID?: string;
  title?: string;
}): Promise<Deal[]> {
  const sanitized = sanitizeDealParams(params);
  const url = buildDealsUrl(sanitized);
  return fetchDealsWithFallback(url.toString());
}

// fallow-ignore-next-line unused-export
export async function getStoresAction(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  try {
    const res = await fetch(`${BASE_URL}/stores`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const stores = (await res.json()) as Store[];
      for (const s of stores) {
        map[s.storeID] = s.storeName;
      }
    }
  } catch (e) {
    console.error('getStoresAction error:', e);
  }

  map['101'] = 'CDKeys';
  map['102'] = 'Kinguin';
  map['103'] = 'Eneba';
  map['104'] = 'Gamivo';

  return map;
}

/**
 * Busca detalhes de um jogo
 */
// fallow-ignore-next-line unused-export
export async function getGameAction(id: string): Promise<GameDetails | null> {
  return (await fetchGameDetails(id, 'getGameAction')) as GameDetails | null;
}

/**
 * Server Actions — wrappers finos sobre CheapShark API.
 * Para lógica de negócio (keyshops, DRM, pricing), use services/api.ts.
 */

async function performIngestion(
  deals: CheapSharkDeal[]
): Promise<{ dealsIngested: number; gamesUpserted: number; pricesRecorded: number }> {
  const idMap = await upsertGames(deals);
  let dealsIngested = 0;
  let pricesRecorded = 0;

  if (idMap.size > 0) {
    const dealsValues = buildDealsInsertValues(deals, idMap);
    if (dealsValues.length > 0) {
      await db.insert(dealsTable).values(dealsValues);
      dealsIngested = dealsValues.length;
    }

    const priceValues = buildPriceHistoryValues(deals, idMap);
    for (let i = 0; i < priceValues.length; i += 50) {
      await db.insert(priceHistory).values(priceValues.slice(i, i + 50));
    }
    pricesRecorded = priceValues.length;
  }

  return { dealsIngested, gamesUpserted: idMap.size, pricesRecorded };
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
    const deals = await fetchCheapSharkDeals();
    if (!deals || deals.length === 0) {
      return { success: true, dealsIngested: 0, gamesUpserted: 0, pricesRecorded: 0 };
    }

    const { dealsIngested, gamesUpserted, pricesRecorded } = await performIngestion(deals);

    return {
      success: true,
      dealsIngested,
      gamesUpserted,
      pricesRecorded,
    };
  } catch (error) {
    console.error('Ingest error:', error);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
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
 * Resolve cheapsharkId -> games.id uuid via resolve_game_uuid() RPC.
 * Returns null when game not yet ingested.
 */
export async function resolveGameUuid(cheapsharkId: string): Promise<string | null> {
  if (!/^\d{1,32}$/.test(cheapsharkId)) return null;
  try {
    const rows = await db.execute(
      sql`SELECT public.resolve_game_uuid(${cheapsharkId})::text AS uuid`
    );
    const uuid = (rows as unknown as Array<{ uuid: string | null }>)[0]?.uuid;
    return uuid ?? null;
  } catch (e) {
    console.error('resolveGameUuid error:', e);
    return null;
  }
}

/**
 * Batch cheapsharkId -> uuid. Returns Map keyed by cheapsharkId.
 * Unknown ids omitted from map.
 */
export async function resolveGameUuidsAction(
  cheapsharkIds: string[]
): Promise<Record<string, string>> {
  const valid = [...new Set(cheapsharkIds.filter((id) => /^\d{1,32}$/.test(id)))];
  if (valid.length === 0) return {};
  try {
    const rows = (await db.execute(
      sql`SELECT "cheapsharkId", id::text AS uuid FROM public.games WHERE "cheapsharkId" = ANY(${valid})`
    )) as unknown as Array<{ cheapsharkId: string; uuid: string }>;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.cheapsharkId] = r.uuid;
    return map;
  } catch (e) {
    console.error('resolveGameUuidsAction error:', e);
    return {};
  }
}

/**
 * Reverse lookup: uuid -> cheapsharkId.
 */
export async function resolveCheapsharkByUuidAction(uuid: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return null;
  try {
    const rows = await db.execute(
      sql`SELECT public.resolve_cheapshark_id(${uuid}::uuid) AS cheapshark_id`
    );
    const id = (rows as unknown as Array<{ cheapshark_id: string | null }>)[0]?.cheapshark_id;
    return id ?? null;
  } catch (e) {
    console.error('resolveCheapsharkByUuidAction error:', e);
    return null;
  }
}

/**
 * Batch uuid -> cheapsharkId. Returns Map keyed by uuid.
 */
export async function resolveCheapsharkByUuidsAction(
  uuids: string[]
): Promise<Record<string, string>> {
  const valid = [...new Set(uuids.filter((u) => /^[0-9a-f-]{36}$/i.test(u)))];
  if (valid.length === 0) return {};
  try {
    const rows = (await db.execute(
      sql`SELECT id::text AS uuid, "cheapsharkId" FROM public.games WHERE id = ANY(${valid}::uuid[])`
    )) as unknown as Array<{ uuid: string; cheapsharkId: string }>;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.uuid] = r.cheapsharkId;
    return map;
  } catch (e) {
    console.error('resolveCheapsharkByUuidsAction error:', e);
    return {};
  }
}

/**
 * Busca preço histórico diário de um jogo
 */
export async function getDailyPriceHistoryAction(cheapsharkId: string, days = 90) {
  const uuid = await resolveGameUuid(cheapsharkId);
  if (!uuid) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM get_daily_prices(${uuid}::uuid, ${days})`);
    return rows;
  } catch (e) {
    console.error('getDailyPriceHistory error:', e);
    return [];
  }
}

/**
 * Busca deals do banco
 */
// fallow-ignore-next-line unused-export
export async function getDealsFromDBAction(limit = 20) {
  const result = await db
    .select({
      gameId: dealsTable.gameId,
      title: games.title,
      storeId: dealsTable.storeId,
      price: dealsTable.price,
      retailPrice: dealsTable.retailPrice,
      savings: dealsTable.savings,
      dealRating: dealsTable.dealRating,
      thumbUrl: games.thumbUrl,
    })
    .from(dealsTable)
    .innerJoin(games, eq(games.id, dealsTable.gameId))
    .orderBy(desc(dealsTable.dealRating))
    .limit(limit);

  return result;
}
