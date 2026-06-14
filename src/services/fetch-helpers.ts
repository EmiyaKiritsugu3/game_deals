import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal } from '@/types/game';

export async function fetchDealsWithFallback(
  url: string,
  errorContext = 'fetchDeals'
): Promise<Deal[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return fallbackDeals;
    const data = (await res.json()) as Deal[];
    return data.length > 0 ? data : fallbackDeals;
  } catch (e) {
    console.error(`${errorContext} error:`, e);
    return fallbackDeals;
  }
}
