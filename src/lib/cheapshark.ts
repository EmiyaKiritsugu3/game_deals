import 'server-only';
import { enrichStore, normaliseDeal } from './deal-utils';
import type { Deal, DealQuery, DealWithStore, GameDetail, GameSearchResult, Store } from './types';

export { dealRedirectUrl, enrichStore, normaliseDeal } from './deal-utils';

const CHEAPSHARK_BASE = 'https://www.cheapshark.com/api/1.0';

/** Tiny in-memory cache to smooth out bursts of identical requests. */
const memCache = new Map<string, { ts: number; data: unknown }>();
const TTL = 1000 * 60 * 2; // 2 min in-memory TTL (route layer handles revalidate)

function memo<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.ts < TTL) {
    return Promise.resolve(hit.data as T);
  }
  const p = fetcher().then((data) => {
    memCache.set(key, { ts: Date.now(), data });
    return data;
  });
  p.catch(() => memCache.delete(key));
  return p;
}

function buildUrl(path: string, params: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${CHEAPSHARK_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function csFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = buildUrl(path, params);
  return memo(url, async () => {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 }, // 5 minute ISR cache
    });
    if (!res.ok) {
      throw new Error(`CheapShark ${path} responded ${res.status}`);
    }
    return (await res.json()) as T;
  });
}

export async function getStores(): Promise<Store[]> {
  const stores = await csFetch<
    Array<{
      storeID: string;
      storeName: string;
      isActive: number;
      images: { banner: string; logo: string; icon: string };
    }>
  >('/stores', {});
  return stores.map((s) => enrichStore(s) as Store);
}

export async function getDeals(query: DealQuery = {}): Promise<DealWithStore[]> {
  const sortByMap: Record<string, DealQuery['sortBy']> = {
    'deal-rating': 'Deal Rating',
    savings: 'Savings',
    'price-asc': 'Price',
    'price-desc': 'Price',
    metacritic: 'Metacritic',
    recent: 'Recent',
  };
  const sortBy = query.sortBy ?? sortByMap[query.sortBy as unknown as string] ?? 'Deal Rating';
  const desc =
    query.desc ??
    (String(query.sortBy) === 'price-desc' ? true : String(query.sortBy) !== 'price-asc');

  const deals = await csFetch<Deal[]>('/deals', {
    storeID: query.storeID,
    pageNumber: query.pageNumber ?? 0,
    pageSize: query.pageSize ?? 60,
    sortBy,
    desc,
    lowerPrice: query.lowerPrice,
    upperPrice: query.upperPrice,
    metacritic: query.metacritic,
    AAA: query.aaa ? 1 : undefined,
    steamworks: query.steamworks ? 1 : undefined,
    exactTitle: query.exactTitle,
    title: query.title,
    onSale: query.onSale ? 1 : undefined,
  });

  let stores: Store[] = [];
  try {
    stores = await getStores();
  } catch {
    /* stores are best-effort enrichment */
  }
  const storeMap = new Map(stores.map((s) => [s.storeID, s]));

  return deals.map((d) => normaliseDeal(d, storeMap.get(d.storeID)));
}

export function searchGames(title: string): Promise<GameSearchResult[]> {
  return csFetch<GameSearchResult[]>('/games', { title, limit: 12 });
}

export function getGameDetail(gameID: string): Promise<GameDetail> {
  return csFetch<GameDetail>('/games', { id: gameID });
}
