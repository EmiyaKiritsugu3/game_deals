import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal } from '@/types/game';

export const CHEAPSHARK_HEADERS = {
  'User-Agent': 'GameDealsTracker/1.0 (Contact: admin@gamedeals.com)',
  Accept: 'application/json',
};

export async function fetchDealsWithFallback(
  url: string,
  errorContext = 'fetchDeals'
): Promise<Deal[]> {
  try {
    const res = await fetch(url, {
      headers: CHEAPSHARK_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallbackDeals;
    const data = (await res.json()) as Deal[];
    return data.length > 0 ? data : fallbackDeals;
  } catch (e) {
    console.error(`${errorContext} error:`, e);
    return fallbackDeals;
  }
}

export async function fetchGameDetails(
  id: string,
  errorContext = 'fetchGameDetails'
): Promise<unknown | null> {
  const url = new URL('https://www.cheapshark.com/api/1.0/games');
  url.searchParams.append('id', id);
  try {
    const res = await fetch(url.toString(), {
      headers: CHEAPSHARK_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`${errorContext} error:`, e);
    return null;
  }
}
