import { GREY_MARKET_SHOPS } from '@/constants/stores';
import type { GameDeal, PriceHistoryPoint } from '@/types/game';

/**
 * Find the cheapest deal in O(N) time without allocating new arrays or sorting.
 * ⚡ Bolt Performance: Prevents O(N log N) time complexity and O(N) memory allocation per iteration.
 */
export function getCheapestDeal<T extends { price: string }>(deals: T[]): T | undefined {
  if (!deals || deals.length === 0) return undefined;
  let bestDeal = deals[0];
  let minPrice = Number.parseFloat(bestDeal.price);

  for (let i = 1; i < deals.length; i++) {
    const currentPrice = Number.parseFloat(deals[i].price);
    if (currentPrice < minPrice) {
      minPrice = currentPrice;
      bestDeal = deals[i];
    }
  }

  return bestDeal;
}

/** Round savings percentage to integer */
export function computeSavings(savings: string): number {
  return Math.round(Number.parseFloat(savings));
}

/** Check if a price string represents a free item */
export function isPriceFree(price: string): boolean {
  return Number.parseFloat(price) === 0;
}

/** Check if deal meets epic threshold (>= 80% off or free) */
export function isEpicDealCheck(savings: number, isFree: boolean): boolean {
  return savings >= 80 || isFree;
}

/** Check if deal meets historical-low proxy threshold (> 87% off) */
export function isHistoricalLowCheck(savings: number): boolean {
  return savings > 87;
}

/** Heuristic to grab high-res Steam capsule images */
export function getHighResImage(url: string) {
  if (url.includes('capsule_sm_120')) {
    return url.replace('capsule_sm_120', 'header');
  }
  return url;
}

/** Format a Unix timestamp into a human-readable "X ago" string */
export function formatTimeAgo(unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixTimestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

/** Generate realistic fake keyshop deals based on the official pricing */
export function generateGreyMarketDeals(officialDeals: GameDeal[], dealIDRef: string): GameDeal[] {
  if (!officialDeals || officialDeals.length === 0) return [];

  // Base it off the current cheapest official deal
  const bestOfficial = getCheapestDeal(officialDeals);
  if (!bestOfficial) return [];
  const retailPrice = Number.parseFloat(bestOfficial.retailPrice);
  const bestPrice = Number.parseFloat(bestOfficial.price);

  // If it's free or under $1, keyshops rarely sell it
  if (bestPrice < 1) return [];

  // Keyshops usually undercult official sales by 5% to 35%
  // ⚡ Bolt Performance: Use for...of to iterate over string. It correctly handles Unicode characters without allocating an array via Array.from.
  let hash = 0;
  for (const char of dealIDRef) {
    hash += char.codePointAt(0) ?? 0;
  }
  const numShops = 1 + (hash % 3); // 1 to 3 keyshops

  const shuffledShops = [...GREY_MARKET_SHOPS].sort(
    (a, b) => (hash % Number.parseInt(a.id, 10)) - (hash % Number.parseInt(b.id, 10))
  );
  const selectedShops = shuffledShops.slice(0, numShops);

  return selectedShops.map((shop, i) => {
    const cutRatio = 0.65 + ((hash + i * 13) % 30) / 100;
    const keyshopPrice = (bestPrice * cutRatio).toFixed(2);

    return {
      storeID: shop.id,
      dealID: `grey-${shop.id}-${dealIDRef}`,
      price: keyshopPrice,
      retailPrice: bestOfficial.retailPrice,
      savings: (((retailPrice - Number.parseFloat(keyshopPrice)) / retailPrice) * 100).toFixed(6),
      dealRating: '0.0',
    };
  });
}

/** Generate realistic 6-month historical curve */
export function generatePriceHistory(
  retailPrice: number,
  currentPrice: number,
  lowestPrice: number,
  seed: string
): PriceHistoryPoint[] {
  const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];
  // ⚡ Bolt Performance: Use for...of to iterate over string. It correctly handles Unicode characters without allocating an array via Array.from.
  let hash = 0;
  for (const char of seed) {
    hash += char.codePointAt(0) ?? 0;
  }

  const data = months.map((month, i) => {
    if (i === 5) return { name: month, price: currentPrice };

    const isOnSale = (hash + i * 17) % 3 === 0;
    if (isOnSale) {
      const saleRatio = 0.3 + ((hash + i * 11) % 70) / 100;
      const simulatedSale = lowestPrice + (retailPrice - lowestPrice) * saleRatio;
      return { name: month, price: Math.round(simulatedSale * 100) / 100 };
    }
    return { name: month, price: retailPrice };
  });

  if (currentPrice > lowestPrice * 1.05) {
    const lowestMonthIndex = hash % 4;
    data[lowestMonthIndex] = { name: months[lowestMonthIndex], price: lowestPrice };
  }

  return data;
}
