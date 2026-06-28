import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameDeal } from '@/types/game';
import {
  formatTimeAgo,
  generateGreyMarketDeals,
  generatePriceHistory,
  getCheapestDeal,
  getHighResImage,
} from './pricing';

// ---------------------------------------------------------------------------
// getHighResImage
// ---------------------------------------------------------------------------
describe('getHighResImage', () => {
  it('replaces capsule_sm_120 with header', () => {
    const url =
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/capsule_sm_120.jpg';
    expect(getHighResImage(url)).toBe(
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg'
    );
  });

  it('returns the original url when capsule_sm_120 is absent', () => {
    const url = 'https://example.com/some_other_image.jpg';
    expect(getHighResImage(url)).toBe(url);
  });

  it('handles empty string', () => {
    expect(getHighResImage('')).toBe('');
  });

  it('only replaces the first occurrence of capsule_sm_120', () => {
    const url = 'https://example.com/capsule_sm_120/foo/capsule_sm_120/bar';
    expect(getHighResImage(url)).toBe('https://example.com/header/foo/capsule_sm_120/bar');
  });
});

// ---------------------------------------------------------------------------
// formatTimeAgo
// ---------------------------------------------------------------------------
describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for diffs less than 60s', () => {
    expect(formatTimeAgo(Math.floor(Date.now() / 1000) - 30)).toBe('just now');
    expect(formatTimeAgo(Math.floor(Date.now() / 1000))).toBe('just now');
    expect(formatTimeAgo(Math.floor(Date.now() / 1000) - 59)).toBe('just now');
  });

  it('returns "Xm ago" for diffs between 1m and 59m', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now - 60)).toBe('1m ago');
    expect(formatTimeAgo(now - 3540)).toBe('59m ago');
    expect(formatTimeAgo(now - 300)).toBe('5m ago');
  });

  it('returns "Xh ago" for diffs between 1h and 23h', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now - 3600)).toBe('1h ago');
    expect(formatTimeAgo(now - 82800)).toBe('23h ago');
    expect(formatTimeAgo(now - 7200)).toBe('2h ago');
  });

  it('returns "Xd ago" for diffs between 1d and 29d', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now - 86400)).toBe('1d ago');
    expect(formatTimeAgo(now - 2592000 + 1)).toBe('29d ago');
    expect(formatTimeAgo(now - 432000)).toBe('5d ago');
  });

  it('returns "Xmo ago" for diffs >= 30 days', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now - 2592000)).toBe('1mo ago');
    expect(formatTimeAgo(now - 7776000)).toBe('3mo ago');
    expect(formatTimeAgo(now - 31536000)).toBe('12mo ago');
  });

  it('handles future timestamps (negative diff)', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now + 10)).toBe('just now');
  });
});

// ---------------------------------------------------------------------------
// generateGreyMarketDeals
// ---------------------------------------------------------------------------
describe('generateGreyMarketDeals', () => {
  const makeDeal = (overrides: Partial<GameDeal> = {}): GameDeal => ({
    storeID: '1',
    dealID: 'abc123',
    price: '29.99',
    retailPrice: '59.99',
    savings: '50.00',
    dealRating: '9.5',
    ...overrides,
  });

  it('returns empty array when officialDeals is empty', () => {
    expect(generateGreyMarketDeals([], 'ref1')).toEqual([]);
  });

  it('returns empty array when officialDeals is null', () => {
    // @ts-expect-error testing null input explicitly
    expect(generateGreyMarketDeals(null, 'ref1')).toEqual([]);
  });

  it('returns empty array when officialDeals is undefined', () => {
    // @ts-expect-error testing undefined input explicitly
    expect(generateGreyMarketDeals(undefined, 'ref1')).toEqual([]);
  });

  it('returns empty array when best price is under $1 (free games)', () => {
    const freeDeals = [makeDeal({ price: '0.99' })];
    expect(generateGreyMarketDeals(freeDeals, 'ref1')).toEqual([]);
  });

  it('returns empty array when best price is $0', () => {
    const freeDeals = [makeDeal({ price: '0.00' })];
    expect(generateGreyMarketDeals(freeDeals, 'ref1')).toEqual([]);
  });

  it('generates 1-3 grey market deals based on dealIDRef hash', () => {
    const deal = makeDeal();
    const result = generateGreyMarketDeals([deal], 'test-ref-123');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('generates deterministic results for the same dealIDRef', () => {
    const deal = makeDeal();
    const first = generateGreyMarketDeals([deal], 'deterministic-ref');
    const second = generateGreyMarketDeals([deal], 'deterministic-ref');
    expect(first).toEqual(second);
  });

  it('prices are lower than the best official deal (keyshop undercut)', () => {
    const deal = makeDeal({ price: '19.99' });
    const deals = generateGreyMarketDeals([deal], 'undercut-test');

    deals.forEach((gd) => {
      expect(Number.parseFloat(gd.price)).toBeLessThan(19.99);
    });
  });

  it('uses correct store IDs from GREY_MARKET_SHOPS (101-104)', () => {
    const deal = makeDeal({ price: '39.99' });
    const deals = generateGreyMarketDeals([deal], 'store-id-test');

    deals.forEach((gd) => {
      expect(gd.storeID).toMatch(/^10[1-4]$/);
    });
  });

  it('dealIDs start with grey-{storeID}- prefix', () => {
    const deal = makeDeal({ price: '29.99' });
    const deals = generateGreyMarketDeals([deal], 'prefix-test');

    deals.forEach((gd) => {
      expect(gd.dealID).toMatch(/^grey-10[1-4]-/);
    });
  });

  it('uses the cheapest official deal when multiple are provided', () => {
    const deals = [
      makeDeal({ storeID: '1', price: '49.99', dealID: 'expensive' }),
      makeDeal({ storeID: '2', price: '19.99', dealID: 'cheap' }),
      makeDeal({ storeID: '3', price: '29.99', dealID: 'medium' }),
    ];
    const greyDeals = generateGreyMarketDeals(deals, 'multi-test');

    greyDeals.forEach((gd) => {
      expect(Number.parseFloat(gd.price)).toBeLessThan(19.99);
    });
  });

  it('deals have a savings field as a percentage string', () => {
    const deal = makeDeal({ price: '25.00', retailPrice: '50.00' });
    const [greyDeal] = generateGreyMarketDeals([deal], 'savings-test');

    expect(greyDeal).toBeDefined();
    expect(greyDeal.savings).toMatch(/^\d+\.\d+$/);
    expect(Number.parseFloat(greyDeal.savings)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// generatePriceHistory
// ---------------------------------------------------------------------------
describe('generatePriceHistory', () => {
  it('returns 6 data points', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'test-game');
    expect(result).toHaveLength(6);
  });

  it('last data point has currentPrice', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'last-pt-test');
    expect(result[5].price).toBe(29.99);
    expect(result[5].name).toBe('Mar');
  });

  it('all data points have "name" and "price" properties', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'shape-test');
    result.forEach((pt) => {
      expect(pt).toHaveProperty('name');
      expect(pt).toHaveProperty('price');
      expect(typeof pt.name).toBe('string');
      expect(typeof pt.price).toBe('number');
    });
  });

  it('prices are never negative', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'non-negative');
    result.forEach((pt) => {
      expect(pt.price).toBeGreaterThanOrEqual(0);
    });
  });

  it('produces deterministic results for the same seed', () => {
    const first = generatePriceHistory(59.99, 29.99, 9.99, 'seed-abc');
    const second = generatePriceHistory(59.99, 29.99, 9.99, 'seed-abc');
    expect(first).toEqual(second);
  });

  it('produces different results for different seeds', () => {
    const resultA = generatePriceHistory(59.99, 29.99, 9.99, 'seed-A');
    const resultB = generatePriceHistory(59.99, 29.99, 9.99, 'seed-B');
    const allSame = resultA.every((pt, i) => pt.price === resultB[i].price);
    expect(allSame).toBe(false);
  });

  it('ensures the lowest price point is included when currentPrice > lowestPrice * 1.05', () => {
    const retail = 100;
    const current = 80;
    const lowest = 10;
    const result = generatePriceHistory(retail, current, lowest, 'lowest-included');

    const hasLowest = result.some((pt) => pt.price === lowest);
    expect(hasLowest).toBe(true);
  });

  it('retail price is used for non-sale months', () => {
    const retail = 59.99;
    const result = generatePriceHistory(retail, 59.99, 59.99, 'no-sales');

    for (let i = 0; i < 5; i++) {
      expect(result[i].price).toBeLessThanOrEqual(retail);
    }
  });

  it('prices are rounded to 2 decimal places', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'rounding-test');
    result.forEach((pt) => {
      const decimals = pt.price.toString().split('.')[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(2);
      }
    });
  });

  it('returns month names in correct order', () => {
    const result = generatePriceHistory(59.99, 29.99, 19.99, 'months-test');
    expect(result.map((pt) => pt.name)).toEqual(['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar']);
  });
});

describe('getCheapestDeal', () => {
  it('returns undefined if deals array is empty', () => {
    expect(getCheapestDeal([])).toBeUndefined();
  });

  it('returns the only deal if array has one element', () => {
    const deals = [{ price: '10.00' }];
    expect(getCheapestDeal(deals)).toEqual({ price: '10.00' });
  });

  it('returns the cheapest deal correctly', () => {
    const deals = [{ price: '15.00' }, { price: '5.00' }, { price: '10.00' }];
    expect(getCheapestDeal(deals)).toEqual({ price: '5.00' });
  });

  it('handles negative prices correctly', () => {
    const deals = [{ price: '0.00' }, { price: '-5.00' }, { price: '5.00' }];
    expect(getCheapestDeal(deals)).toEqual({ price: '-5.00' });
  });
});
