import { db } from '@/db';
import { games } from '@/db/schema';

export interface CheapSharkDeal {
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

export async function fetchCheapSharkDeals(): Promise<CheapSharkDeal[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
      {
        headers: { 'User-Agent': 'GameDeals/1.0' },
        signal: controller.signal,
        next: { revalidate: 0 },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`CheapShark API returned ${res.status}`);
    const deals = (await res.json()) as CheapSharkDeal[];
    return deals || [];
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function upsertGames(deals: CheapSharkDeal[]): Promise<Map<string, string>> {
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
        set: {
          title: deal.title,
          thumbUrl: deal.thumb,
          updatedAt: new Date(),
        },
      })
      .returning({ id: games.id });
    const row = inserted[0];
    if (row?.id) idMap.set(gameId, row.id);
  }
  return idMap;
}

export function buildDealsInsertValues(deals: CheapSharkDeal[], idMap: Map<string, string>) {
  return deals
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
}

export function buildPriceHistoryValues(deals: CheapSharkDeal[], idMap: Map<string, string>) {
  return deals
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
}
