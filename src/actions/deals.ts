'use server';

import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal, GameDetails, Store } from '@/types/game';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * Busca deals da CheapShark com cache de 1h
 * 'use cache' do React 19/Next 16 — cacheia no servidor
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
 * Busca detalhes de um jogo com cache de 1h
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
 * Busca lista de lojas com cache de 24h
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

  // Lojas grey market (não oficiais)
  map['101'] = 'CDKeys';
  map['102'] = 'Kinguin';
  map['103'] = 'Eneba';
  map['104'] = 'Gamivo';

  return map;
}

/**
 * Busca deals por título (search) com cache de 5min
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
