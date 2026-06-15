import { describe, expect, it } from 'vitest';
import type { GameDeal, GameDetails } from '@/types/game';
import {
  buildDealRowProps,
  buildGameStats,
  buildOutUrl,
  HL_THRESHOLD,
  sortDealsByPrice,
  splitDealsByGreyMarket,
} from './game-data';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockDeals: GameDeal[] = [
  {
    storeID: '1',
    dealID: 'abc123',
    price: '19.99',
    retailPrice: '59.99',
    savings: '66.666667',
    dealRating: '9.5',
  },
  {
    storeID: '2',
    dealID: 'grey-def456',
    price: '5.99',
    retailPrice: '59.99',
    savings: '90.000000',
    dealRating: '8.0',
  },
  {
    storeID: '3',
    dealID: 'ghi789',
    price: '0.00',
    retailPrice: '9.99',
    savings: '100.000000',
    dealRating: '10.0',
  },
  {
    storeID: '1',
    dealID: 'jkl012',
    price: '29.99',
    retailPrice: '59.99',
    savings: '50.000000',
    dealRating: '7.5',
  },
];

const mockGameDetails: GameDetails = {
  info: {
    title: 'Test Game',
    steamAppID: '12345',
    thumb: 'https://example.com/thumb.jpg',
  },
  cheapestPriceEver: {
    price: '5.99',
    date: 1700000000,
  },
  deals: mockDeals,
};

// ---------------------------------------------------------------------------
// sortDealsByPrice
// ---------------------------------------------------------------------------

describe('sortDealsByPrice', () => {
  it('sorts deals ascending by price', () => {
    const sorted = sortDealsByPrice(mockDeals);
    expect(sorted.map((d) => d.price)).toEqual(['0.00', '5.99', '19.99', '29.99']);
  });

  it('does not mutate the original array', () => {
    const copy = [...mockDeals];
    sortDealsByPrice(mockDeals);
    expect(mockDeals.map((d) => d.price)).toEqual(copy.map((d) => d.price));
  });

  it('returns empty array for empty input', () => {
    expect(sortDealsByPrice([])).toEqual([]);
  });

  it('handles single-element array', () => {
    const single = [mockDeals[0]];
    const sorted = sortDealsByPrice(single);
    expect(sorted).toEqual(single);
    expect(sorted).not.toBe(single); // new reference
  });
});

// ---------------------------------------------------------------------------
// splitDealsByGreyMarket
// ---------------------------------------------------------------------------

describe('splitDealsByGreyMarket', () => {
  const isGrey = (storeID: string) => storeID === '2';

  it('splits deals into official and keyshop buckets', () => {
    const { official, keyshop } = splitDealsByGreyMarket(mockDeals, isGrey);
    expect(official).toHaveLength(3);
    expect(keyshop).toHaveLength(1);
    expect(official.every((d) => !isGrey(d.storeID))).toBe(true);
    expect(keyshop.every((d) => isGrey(d.storeID))).toBe(true);
  });

  it('returns empty keyshop when no grey market stores', () => {
    const { official, keyshop } = splitDealsByGreyMarket(mockDeals, () => false);
    expect(official).toHaveLength(4);
    expect(keyshop).toHaveLength(0);
  });

  it('returns empty official when all are grey market', () => {
    const { official, keyshop } = splitDealsByGreyMarket(mockDeals, () => true);
    expect(official).toHaveLength(0);
    expect(keyshop).toHaveLength(4);
  });

  it('handles empty array', () => {
    const { official, keyshop } = splitDealsByGreyMarket([], isGrey);
    expect(official).toEqual([]);
    expect(keyshop).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildGameStats
// ---------------------------------------------------------------------------

describe('buildGameStats', () => {
  it('returns bestCurrentPrice and cheapestEver correctly', () => {
    const stats = buildGameStats(mockGameDetails, 5.99);
    expect(stats.bestCurrentPrice).toBe(5.99);
    expect(stats.cheapestEver).toBe(5.99);
  });

  it('detects when price is at historical low', () => {
    const stats = buildGameStats(mockGameDetails, 5.99);
    expect(stats.isCurrentlyAtHL).toBe(true);
  });

  it('detects when price is within HL threshold', () => {
    // cheapestEver = 5.99, threshold = 5.99 * 1.05 = 6.2895
    // 6.28 <= 6.2895 → true
    const stats = buildGameStats(mockGameDetails, 6.28);
    expect(stats.isCurrentlyAtHL).toBe(true);
  });

  it('detects when price is above HL threshold', () => {
    const stats = buildGameStats(mockGameDetails, 7.0);
    expect(stats.isCurrentlyAtHL).toBe(false);
  });

  it('detects free game', () => {
    const stats = buildGameStats(mockGameDetails, 0);
    expect(stats.isFree).toBe(true);
  });

  it('detects non-free game', () => {
    const stats = buildGameStats(mockGameDetails, 19.99);
    expect(stats.isFree).toBe(false);
  });

  it('HL_THRESHOLD is 1.05', () => {
    expect(HL_THRESHOLD).toBe(1.05);
  });
});

// ---------------------------------------------------------------------------
// buildOutUrl
// ---------------------------------------------------------------------------

describe('buildOutUrl', () => {
  it('builds CheapShark redirect URL for non-grey deal', () => {
    const deal = mockDeals[0]; // storeID: '1', dealID: 'abc123'
    const url = buildOutUrl(deal, 'Test Game', 'Steam');
    expect(url).toContain('/out?url=');
    expect(url).toContain(encodeURIComponent('https://www.cheapshark.com/redirect?dealID=abc123'));
    expect(url).toContain(encodeURIComponent('Steam'));
  });

  it('builds grey market search URL for grey deal', () => {
    const deal = mockDeals[1]; // storeID: '2', dealID: 'grey-def456'
    const url = buildOutUrl(deal, 'Test Game', 'G2A');
    expect(url).toContain('/out?url=');
    // The inner URL is encoded inside the outer encodeURIComponent,
    // so we check for encoded fragments rather than decoded symbols.
    expect(url).toMatch(/g2a/);
    expect(url).toMatch(/search/);
    expect(url).not.toContain(encodeURIComponent('https://www.cheapshark.com/redirect'));
  });

  it('encodes special characters in game title', () => {
    const deal = mockDeals[0];
    const url = buildOutUrl(deal, 'Game & Discount!', 'Steam');
    expect(url).toContain(encodeURIComponent('https://www.cheapshark.com/redirect?dealID=abc123'));
  });

  it('handles empty store name', () => {
    const deal = mockDeals[0];
    const url = buildOutUrl(deal, 'Test', '');
    expect(url).toContain('/out?url=');
  });
});

// ---------------------------------------------------------------------------
// buildDealRowProps
// ---------------------------------------------------------------------------

describe('buildDealRowProps', () => {
  it('computes savings as rounded integer percentage', () => {
    const props = buildDealRowProps(mockDeals[0], 5.99);
    expect(props.savings).toBe(67);
  });

  it('parses price as a number', () => {
    const props = buildDealRowProps(mockDeals[0], 5.99);
    expect(props.price).toBe(19.99);
  });

  it('detects deal at historical low', () => {
    // cheapestEver = 5.99, deal price = 5.99 → at HL
    const props = buildDealRowProps(mockDeals[1], 5.99);
    expect(props.isDealAtHL).toBe(true);
  });

  it('detects deal NOT at historical low', () => {
    // cheapestEver = 5.99, deal price = 19.99 → not at HL
    const props = buildDealRowProps(mockDeals[0], 5.99);
    expect(props.isDealAtHL).toBe(false);
  });

  it('detects deal within HL threshold', () => {
    // cheapestEver = 5.99, threshold = 6.2895, deal price = 6.28 → at HL
    const nearHlDeal: GameDeal = {
      storeID: '1',
      dealID: 'near-hl',
      price: '6.28',
      retailPrice: '59.99',
      savings: '89.000000',
      dealRating: '8.0',
    };
    const props = buildDealRowProps(nearHlDeal, 5.99);
    expect(props.isDealAtHL).toBe(true);
  });

  it('detects free deal', () => {
    const props = buildDealRowProps(mockDeals[2], 5.99);
    expect(props.isFree).toBe(true);
  });

  it('detects epic deal (savings >= 75)', () => {
    // savings = 67 (< 75) → not epic
    const notEpic = buildDealRowProps(mockDeals[0], 5.99);
    expect(notEpic.isEpicDeal).toBe(false);

    // savings = 90 → epic
    const epic = buildDealRowProps(mockDeals[1], 5.99);
    expect(epic.isEpicDeal).toBe(true);

    // price = 0 (free) → epic
    const free = buildDealRowProps(mockDeals[2], 5.99);
    expect(free.isEpicDeal).toBe(true);
  });

  it('handles deal with 0% savings and non-free price', () => {
    const noSavings: GameDeal = {
      storeID: '1',
      dealID: 'no-save',
      price: '59.99',
      retailPrice: '59.99',
      savings: '0.000000',
      dealRating: '5.0',
    };
    const props = buildDealRowProps(noSavings, 5.99);
    expect(props.savings).toBe(0);
    expect(props.isFree).toBe(false);
    expect(props.isEpicDeal).toBe(false);
  });
});
