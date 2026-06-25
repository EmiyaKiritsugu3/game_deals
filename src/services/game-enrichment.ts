import type { GameDetails } from '@/types/game';
import { generateGreyMarketDeals } from '@/utils/pricing';

export async function fetchGamesBatchFromCheapShark(
  ids: string[]
): Promise<Record<string, GameDetails> | null> {
  if (ids.length === 0) return null;
  const url = new URL('https://www.cheapshark.com/api/1.0/games');
  url.searchParams.append('ids', ids.join(','));
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, GameDetails>;
  } catch {
    return null;
  }
}

export async function fetchGameFromCheapShark(id: string): Promise<GameDetails | null> {
  const url = new URL('https://www.cheapshark.com/api/1.0/games');
  url.searchParams.append('id', id);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as GameDetails;
  } catch {
    return null;
  }
}

export function enrichWithGreyMarketDeals(game: GameDetails, id: string): void {
  if (game?.deals && game.deals.length > 0) {
    const greyDeals = generateGreyMarketDeals(game.deals, id);
    game.deals = [...game.deals, ...greyDeals];
  }
}

/** NOTE: mutates game.cheapestPriceEver in place if current lowest price is lower. */
export function updateHistoricalLow(game: GameDetails): void {
  if (!game?.deals || game.deals.length === 0) return;
  const currentLowest = [...game.deals].sort(
    (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
  )[0];
  if (currentLowest && game.cheapestPriceEver) {
    if (Number.parseFloat(currentLowest.price) < Number.parseFloat(game.cheapestPriceEver.price)) {
      game.cheapestPriceEver.price = currentLowest.price;
      game.cheapestPriceEver.date = Math.floor(Date.now() / 1000);
    }
  }
}
