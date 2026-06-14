'use server';

import { desc, eq, sql } from 'drizzle-orm';
import { fallbackDeals } from '@/data/fallbackDeals';
import { db } from '@/db';
import { deals as dealsTable, games, priceHistory } from '@/db/schema';
import type { Deal, GameDetails, Store } from '@/types/game';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * Busca deals da CheapShark (com fallback)
 */
// fallow-ignore-next-line complexity
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
  const sortBy =
    params?.sortBy && ALLOWED_SORT.includes(params.sortBy as (typeof ALLOWED_SORT)[number])
      ? params.sortBy
      : 'Deal Rating';
  const pageSizeRaw = params?.pageSize ? Number.parseInt(params.pageSize, 10) : 20;
  const pageSize = Math.max(1, Math.min(100, Number.isNaN(pageSizeRaw) ? 20 : pageSizeRaw));

  const url = new URL(`${BASE_URL}/deals`);
  url.searchParams.append('sortBy', sortBy);
  url.searchParams.append('onSale', params?.onSale ?? '1');
  url.searchParams.append('pageSize', String(pageSize));

  if (params?.upperPrice && !Number.isNaN(Number(params.upperPrice)))
    url.searchParams.append('upperPrice', params.upperPrice);
  if (params?.lowerPrice && !Number.isNaN(Number(params.lowerPrice)))
    url.searchParams.append('lowerPrice', params.lowerPrice);
  if (params?.storeID && /^\d{1,3}$/.test(params.storeID))
    url.searchParams.append('storeID', params.storeID);
  if (params?.title && params.title.length <= 200)
    url.searchParams.append('title', encodeURIComponent(params.title));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return fallbackDeals;
    const data = (await res.json()) as Deal[];
    return data.length > 0 ? data : fallbackDeals;
  } catch (e) {
    console.error('getDealsAction error:', e);
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
    return (await res.json()) as GameDetails | null;
  } catch (e) {
    console.error('getGameAction error:', e);
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
 * Server Actions — wrappers finos sobre CheapShark API.
 * Para lógica de negócio (keyshops, DRM, pricing), use services/api.ts.
 */

/**
 * Ingestão de preços — busca deals e salva no banco + price_history
 */
// fallow-ignore-next-line complexity
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
      return {
        success: false,
        dealsIngested: 0,
        gamesUpserted: 0,
        pricesRecorded: 0,
        error: `CheapShark API error: ${res.status}`,
      };
    }

    // Only fields accessed in this function — partial CheapShark deal shape
    interface CheapSharkDeal {
      gameID: string;
      title: string;
      thumb: string;
      storeID: string;
      salePrice: string;
      normalPrice: string;
      savings: string;
      dealRating: string;
      dealID: string;
    }
    const deals = (await res.json()) as CheapSharkDeal[];
    if (!deals || deals.length === 0) {
      return { success: true, dealsIngested: 0, gamesUpserted: 0, pricesRecorded: 0 };
    }

    let gamesUpserted = 0;
    let dealsIngested = 0;
    let pricesRecorded = 0;

    const uniqueGameIds = [...new Set(deals.map((d) => d.gameID))];
    const idMap = new Map<string, string>();

    for (const gameId of uniqueGameIds) {
      const deal = deals.find((d) => d.gameID === gameId);
      if (!deal) continue;

      const inserted = await db
        .insert(games)
        .values({
          cheapsharkId: gameId,
          title: deal.title,
          thumbUrl: deal.thumb,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: games.cheapsharkId,
          set: { title: deal.title, thumbUrl: deal.thumb, updatedAt: new Date() },
        })
        .returning({ id: games.id });

      const row = inserted[0];
      if (row?.id) idMap.set(gameId, row.id);
      gamesUpserted++;
    }

    if (deals.length > 0 && idMap.size > 0) {
      const dealsValues = deals
        .map((d) => {
          const uuid = idMap.get(d.gameID);
          if (!uuid) return null;
          return {
            gameId: uuid,
            storeId: d.storeID,
            price: Number.parseFloat(d.salePrice),
            retailPrice: Number.parseFloat(d.normalPrice),
            savings: Number.parseFloat(d.savings),
            dealRating: d.dealRating ? Number.parseFloat(d.dealRating) : null,
            url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
            createdAt: new Date(),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (dealsValues.length > 0) {
        await db.insert(dealsTable).values(dealsValues);
        dealsIngested = dealsValues.length;
      }

      const priceValues = deals
        .map((d) => {
          const uuid = idMap.get(d.gameID);
          if (!uuid) return null;
          return {
            gameId: uuid,
            storeId: d.storeID,
            price: Number.parseFloat(d.salePrice),
            retailPrice: Number.parseFloat(d.normalPrice),
            recordedAt: new Date(),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

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
 * Busca preço histórico semanal de um jogo
 */
export async function getWeeklyPriceHistoryAction(cheapsharkId: string, weeks = 26) {
  const uuid = await resolveGameUuid(cheapsharkId);
  if (!uuid) return [];
  try {
    const rows = await db.execute(sql`SELECT * FROM get_weekly_prices(${uuid}::uuid, ${weeks})`);
    return rows;
  } catch (e) {
    console.error('getWeeklyPriceHistory error:', e);
    return [];
  }
}

/**
 * Busca deals do banco
 */
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
