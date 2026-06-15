import type { GameDeal, GameDetails } from '@/types/game';

export const HL_THRESHOLD = 1.05;

/**
 * Sort deals ascending by price (returns new array, does not mutate).
 */
export function sortDealsByPrice(deals: GameDeal[]): GameDeal[] {
  return [...deals].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price));
}

/**
 * Split deals into official + keyshop (grey market) buckets.
 * Uses the provided `isGrey` predicate to classify each deal by storeID.
 */
export function splitDealsByGreyMarket(
  deals: GameDeal[],
  isGrey: (storeID: string) => boolean
): { official: GameDeal[]; keyshop: GameDeal[] } {
  const official: GameDeal[] = [];
  const keyshop: GameDeal[] = [];

  for (const deal of deals) {
    if (isGrey(deal.storeID)) {
      keyshop.push(deal);
    } else {
      official.push(deal);
    }
  }

  return { official, keyshop };
}

/**
 * Build stats block for the game hero section.
 * @param game - Game details (includes cheapestPriceEver)
 * @param bestCurrentPrice - The best current price among all deals
 */
export function buildGameStats(
  game: GameDetails,
  bestCurrentPrice: number
): {
  bestCurrentPrice: number;
  cheapestEver: number;
  isCurrentlyAtHL: boolean;
  isFree: boolean;
} {
  const cheapestEver = Number.parseFloat(game.cheapestPriceEver.price);
  const isCurrentlyAtHL = bestCurrentPrice <= cheapestEver * HL_THRESHOLD;
  const isFree = bestCurrentPrice === 0;

  return {
    bestCurrentPrice,
    cheapestEver,
    isCurrentlyAtHL,
    isFree,
  };
}

/**
 * Build the /out redirect URL for a deal.
 * Grey-market deals (dealID starts with 'grey-') get a store search link;
 * official deals get a CheapShark redirect link.
 */
export function buildOutUrl(deal: GameDeal, gameTitle: string, storeName: string): string {
  const targetUrl = deal.dealID.startsWith('grey-')
    ? `https://www.${storeName.toLowerCase().replace(/\s+/g, '')}.com/search?q=${encodeURIComponent(gameTitle)}`
    : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;

  return `/out?url=${encodeURIComponent(targetUrl)}&store=${encodeURIComponent(storeName)}`;
}

/**
 * Compute price/display values for a single deal row.
 * @param deal - The deal to compute props for
 * @param cheapestEver - The historical lowest price (from game.cheapestPriceEver)
 */
export function buildDealRowProps(
  deal: GameDeal,
  cheapestEver: number
): {
  savings: number;
  price: number;
  isDealAtHL: boolean;
  isFree: boolean;
  isEpicDeal: boolean;
} {
  const savings = Math.round(Number.parseFloat(deal.savings));
  const price = Number.parseFloat(deal.price);
  const isDealAtHL = price <= cheapestEver * HL_THRESHOLD;
  const isFree = price === 0;
  const isEpicDeal = savings >= 75 || isFree;

  return {
    savings,
    price,
    isDealAtHL,
    isFree,
    isEpicDeal,
  };
}
