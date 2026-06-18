import { fallbackDeals } from '@/data/fallbackDeals';
import type { Deal } from '@/types/game';

export async function fetchDealsWithFallback(
  url: string,
  errorContext = 'fetchDeals'
): Promise<Deal[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GameDeals/1.0' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return fallbackDeals;
    const data = (await res.json()) as Deal[];
    return data.length > 0 ? data : fallbackDeals;
  } catch (e) {
    clearTimeout(timeout);
    console.error(`${errorContext} error:`, e);
    return fallbackDeals;
  }
}

export async function fetchGameDetails(
  id: string,
  errorContext = 'fetchGameDetails'
): Promise<unknown> {
  const url = new URL('https://www.cheapshark.com/api/1.0/games');
  url.searchParams.append('id', id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'GameDeals/1.0' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    console.error(`${errorContext} error:`, e);
    return null;
  }
}
