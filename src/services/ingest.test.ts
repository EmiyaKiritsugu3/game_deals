import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReturning = vi.hoisted(() => vi.fn());
const mockOnConflictDoUpdate = vi.hoisted(() => vi.fn(() => ({ returning: mockReturning })));
const mockValues = vi.hoisted(() => vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate })));
const mockInsert = vi.hoisted(() => vi.fn(() => ({ values: mockValues })));

vi.mock('@/db', () => ({ db: { insert: mockInsert } }));

import {
  buildDealsInsertValues,
  buildPriceHistoryValues,
  fetchCheapSharkDeals,
  upsertGames,
} from './ingest';

const sampleDeals = [
  {
    gameID: '187203',
    title: 'Cyberpunk 2077',
    thumb: 'https://example.com/thumb.jpg',
    storeID: '1',
    salePrice: '29.99',
    normalPrice: '59.99',
    savings: '50.000000',
    dealRating: '9.5',
    dealID: 'abc123',
  },
  {
    gameID: '187204',
    title: 'Witcher 3',
    thumb: 'https://example.com/witcher.jpg',
    storeID: '2',
    salePrice: '9.99',
    normalPrice: '39.99',
    savings: '75.000000',
    dealRating: '8.2',
    dealID: 'def456',
  },
];

describe('fetchCheapSharkDeals', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  it('fetches deals from CheapShark API and returns parsed data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDeals),
    });
    const result = await fetchCheapSharkDeals();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
      { next: { revalidate: 0 } }
    );
    expect(result).toEqual(sampleDeals);
    expect(result).toHaveLength(2);
  });

  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await expect(fetchCheapSharkDeals()).rejects.toThrow(/CheapShark API/);
  });

  it('returns empty array when json is null or undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });
    const result = await fetchCheapSharkDeals();
    expect(result).toEqual([]);
  });
});

describe('upsertGames', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockValues.mockReset();
    mockOnConflictDoUpdate.mockReset();
    mockReturning.mockReset();
  });

  it('inserts games and returns idMap', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'uuid-187203' }]);
    mockReturning.mockResolvedValueOnce([{ id: 'uuid-187204' }]);

    const result = await upsertGames(sampleDeals);

    expect(result.get('187203')).toBe('uuid-187203');
    expect(result.get('187204')).toBe('uuid-187204');
    expect(result.size).toBe(2);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockValues).toHaveBeenCalledTimes(2);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(2);
    expect(mockReturning).toHaveBeenCalledTimes(2);
  });

  it('dedupes duplicate gameIds in input', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'uuid-187203' }]);

    const firstDeal = sampleDeals[0];
    if (!firstDeal) throw new Error('sampleDeals[0] should be defined');
    const dupes = [firstDeal, { ...firstDeal, dealID: 'different-deal' }];
    const result = await upsertGames(dupes);

    expect(result.get('187203')).toBe('uuid-187203');
    expect(result.size).toBe(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('returns empty map when no deals provided', async () => {
    const result = await upsertGames([]);
    expect(result.size).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe('buildDealsInsertValues', () => {
  it('returns correct insert values from deals and idMap', () => {
    const idMap = new Map([
      ['187203', 'uuid-187203'],
      ['187204', 'uuid-187204'],
    ]);
    const result = buildDealsInsertValues(sampleDeals, idMap);

    expect(result).toHaveLength(2);
    expect(result[0]?.gameId).toBe('uuid-187203');
    expect(result[0]?.storeId).toBe('1');
    expect(result[0]?.price).toBe(29.99);
    expect(result[0]?.retailPrice).toBe(59.99);
    expect(result[0]?.savings).toBe(50);
    expect(result[0]?.dealRating).toBe(9.5);
    expect(result[0]?.url).toBe('https://www.cheapshark.com/redirect?dealID=abc123');
    expect(result[1]?.gameId).toBe('uuid-187204');
    expect(result[1]?.storeId).toBe('2');
  });

  it('filters out entries where gameId has no uuid mapping', () => {
    const idMap = new Map([['187203', 'uuid-187203']]);
    const result = buildDealsInsertValues(sampleDeals, idMap);

    expect(result).toHaveLength(1);
    expect(result[0]?.gameId).toBe('uuid-187203');
  });

  it('returns empty array for empty deals', () => {
    const idMap = new Map<string, string>();
    const result = buildDealsInsertValues([], idMap);
    expect(result).toEqual([]);
  });

  it('handles empty dealRating', () => {
    const deals = [
      {
        gameID: '187999',
        title: 'No Rating',
        thumb: '',
        storeID: '1',
        salePrice: '10.00',
        normalPrice: '20.00',
        savings: '50.000000',
        dealRating: '',
        dealID: 'xyz789',
      },
    ];
    const idMap = new Map([['187999', 'uuid-187999']]);
    const result = buildDealsInsertValues(deals, idMap);

    expect(result).toHaveLength(1);
    expect(result[0]?.dealRating).toBeNull();
  });
});

describe('buildPriceHistoryValues', () => {
  it('returns correct price history values from deals and idMap', () => {
    const idMap = new Map([
      ['187203', 'uuid-187203'],
      ['187204', 'uuid-187204'],
    ]);
    const result = buildPriceHistoryValues(sampleDeals, idMap);

    expect(result).toHaveLength(2);
    expect(result[0]?.gameId).toBe('uuid-187203');
    expect(result[0]?.storeId).toBe('1');
    expect(result[0]?.price).toBe(29.99);
    expect(result[0]?.retailPrice).toBe(59.99);
    expect(result[1]?.gameId).toBe('uuid-187204');
    expect(result[1]?.storeId).toBe('2');
    expect(result[1]?.price).toBe(9.99);
  });

  it('filters out entries where gameId has no uuid mapping', () => {
    const idMap = new Map([['187204', 'uuid-187204']]);
    const result = buildPriceHistoryValues(sampleDeals, idMap);

    expect(result).toHaveLength(1);
    expect(result[0]?.gameId).toBe('uuid-187204');
  });

  it('returns empty array for empty deals', () => {
    const idMap = new Map<string, string>();
    const result = buildPriceHistoryValues([], idMap);
    expect(result).toEqual([]);
  });
});
