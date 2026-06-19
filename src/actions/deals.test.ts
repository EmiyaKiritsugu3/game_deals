import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  execute,
  authGetUser,
  mockInsert,
  mockOnConflictDoUpdate,
  mockFetchDealsWithFallback,
  mockFetchGameDetails,
  mockBuildDealsInsertValues,
  mockBuildPriceHistoryValues,
  mockSelect,
} = vi.hoisted(() => {
  const ret = vi.fn();
  const ocdu = vi.fn(() => ({ returning: ret }));
  const vals = vi.fn(() => ({ onConflictDoUpdate: ocdu }));
  const ins = vi.fn(() => ({ values: vals }));
  return {
    execute: vi.fn(),
    authGetUser: vi.fn(),
    mockInsert: ins,
    mockOnConflictDoUpdate: ocdu,
    mockFetchDealsWithFallback: vi.fn(),
    mockFetchGameDetails: vi.fn(),
    mockBuildDealsInsertValues: vi.fn(),
    mockBuildPriceHistoryValues: vi.fn(),
    mockSelect: vi.fn(),
  };
});

vi.mock('@/db', () => ({ db: { execute, insert: mockInsert, select: mockSelect } }));

vi.mock('@/services/fetch-helpers', () => ({
  fetchDealsWithFallback: mockFetchDealsWithFallback,
  fetchGameDetails: mockFetchGameDetails,
}));

vi.mock('@/services/ingest', () => ({
  fetchCheapSharkDeals: vi.fn(),
  upsertGames: vi.fn(),
  buildDealsInsertValues: mockBuildDealsInsertValues,
  buildPriceHistoryValues: mockBuildPriceHistoryValues,
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

import { db } from '@/db';
import { deals as dealsTable } from '@/db/schema';
import { fetchCheapSharkDeals, upsertGames } from '@/services/ingest';
import {
  getDailyPriceHistoryAction,
  getDealsAction,
  getDealsFromDBAction,
  getGameAction,
  getStoresAction,
  ingestPricesAction,
  resolveCheapsharkByUuidAction,
  resolveCheapsharkByUuidsAction,
  resolveGameUuid,
  resolveGameUuidsAction,
} from './deals';

beforeEach(() => {
  execute.mockReset();
  authGetUser.mockReset();
  mockSelect.mockReset();
  mockFetchDealsWithFallback.mockReset();
  mockFetchGameDetails.mockReset();
  mockBuildDealsInsertValues.mockReset();
  mockBuildPriceHistoryValues.mockReset();
  vi.mocked(fetchCheapSharkDeals).mockReset();
  vi.mocked(upsertGames).mockReset();
});

describe('resolveGameUuid', () => {
  it('returns null for non-numeric input', async () => {
    expect(await resolveGameUuid('not-a-number')).toBeNull();
    expect(await resolveGameUuid('')).toBeNull();
    expect(await resolveGameUuid('abc123')).toBeNull();
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns null for id exceeding 32 chars', async () => {
    expect(await resolveGameUuid('1'.repeat(33))).toBeNull();
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns uuid string when RPC returns row', async () => {
    execute.mockResolvedValueOnce([{ uuid: '11111111-2222-3333-4444-555555555555' }]);
    const result = await resolveGameUuid('123456');
    expect(result).toBe('11111111-2222-3333-4444-555555555555');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns null when RPC returns null uuid', async () => {
    execute.mockResolvedValueOnce([{ uuid: null }]);
    expect(await resolveGameUuid('123456')).toBeNull();
  });

  it('returns null when RPC returns empty array', async () => {
    execute.mockResolvedValueOnce([]);
    expect(await resolveGameUuid('123456')).toBeNull();
  });

  it('returns null and swallows db error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execute.mockRejectedValueOnce(new Error('connection lost'));
    expect(await resolveGameUuid('123456')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('resolveGameUuidsAction (batch)', () => {
  it('returns empty map for empty input', async () => {
    const result = await resolveGameUuidsAction([]);
    expect(result).toEqual({});
    expect(execute).not.toHaveBeenCalled();
  });

  it('filters invalid ids then queries with valid set', async () => {
    execute.mockResolvedValueOnce([
      { cheapsharkId: '111', uuid: 'aaaa' },
      { cheapsharkId: '222', uuid: 'bbbb' },
    ]);
    const result = await resolveGameUuidsAction(['111', 'nope', '222']);
    expect(result).toEqual({ '111': 'aaaa', '222': 'bbbb' });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('dedupes repeated ids in input', async () => {
    execute.mockResolvedValueOnce([{ cheapsharkId: '111', uuid: 'aaaa' }]);
    const result = await resolveGameUuidsAction(['111', '111', '111']);
    expect(result).toEqual({ '111': 'aaaa' });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns empty map on db error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execute.mockRejectedValueOnce(new Error('timeout'));
    expect(await resolveGameUuidsAction(['111', '222'])).toEqual({});
    errorSpy.mockRestore();
  });
});

describe('resolveCheapsharkByUuidAction', () => {
  it('returns null for malformed uuid', async () => {
    expect(await resolveCheapsharkByUuidAction('not-a-uuid')).toBeNull();
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns cheapshark id when found', async () => {
    execute.mockResolvedValueOnce([{ cheapshark_id: '187203' }]);
    expect(await resolveCheapsharkByUuidAction('11111111-2222-3333-4444-555555555555')).toBe(
      '187203'
    );
  });

  it('returns null when not found', async () => {
    execute.mockResolvedValueOnce([{ cheapshark_id: null }]);
    expect(await resolveCheapsharkByUuidAction('11111111-2222-3333-4444-555555555555')).toBeNull();
  });

  it('returns null and swallows db error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execute.mockRejectedValueOnce(new Error('boom'));
    expect(await resolveCheapsharkByUuidAction('11111111-2222-3333-4444-555555555555')).toBeNull();
    errorSpy.mockRestore();
  });
});

describe('resolveCheapsharkByUuidsAction (batch)', () => {
  it('returns empty map for empty input', async () => {
    expect(await resolveCheapsharkByUuidsAction([])).toEqual({});
    expect(execute).not.toHaveBeenCalled();
  });

  it('filters invalid uuids then queries valid set', async () => {
    execute.mockResolvedValueOnce([
      { uuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', cheapsharkId: '111' },
      { uuid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', cheapsharkId: '222' },
    ]);
    const result = await resolveCheapsharkByUuidsAction([
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'not-uuid',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ]);
    expect(result).toEqual({
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': '111',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': '222',
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns empty on db error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execute.mockRejectedValueOnce(new Error('fail'));
    expect(await resolveCheapsharkByUuidsAction(['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'])).toEqual(
      {}
    );
    errorSpy.mockRestore();
  });
});

describe('ingestPricesAction', () => {
  it('returns success:false on CheapShark error', async () => {
    vi.mocked(fetchCheapSharkDeals).mockRejectedValueOnce(new Error('CheapShark API returned 500'));
    vi.mocked(upsertGames).mockResolvedValueOnce(new Map());

    const result = await ingestPricesAction();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/CheapShark API/);
  });

  it('calls onConflictDoUpdate with (gameId, storeId) target on deals insert', async () => {
    const dealsValues = [
      {
        gameId: 'uuid-1',
        storeId: '1',
        price: 9.99,
        retailPrice: 19.99,
        savings: 50,
        dealRating: 8.0,
        url: 'https://www.cheapshark.com/redirect?dealID=deal1',
        createdAt: new Date(),
      },
    ];

    await db
      .insert(dealsTable)
      .values(dealsValues)
      .onConflictDoUpdate({
        target: [dealsTable.gameId, dealsTable.storeId],
        set: {
          price: 0,
        },
      });

    expect(mockInsert).toHaveBeenCalledWith(dealsTable);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [dealsTable.gameId, dealsTable.storeId],
      })
    );
  });
});

describe('getDailyPriceHistoryAction', () => {
  it('returns empty when uuid not found', async () => {
    execute.mockResolvedValueOnce([{ uuid: null }]);
    const result = await getDailyPriceHistoryAction('123456', 30);
    expect(result).toEqual([]);
  });

  it('returns empty when no rows', async () => {
    execute.mockResolvedValueOnce([{ uuid: 'aaaa-bbbb' }]);
    execute.mockResolvedValueOnce([]);
    const result = await getDailyPriceHistoryAction('123456', 30);
    expect(result).toEqual([]);
  });

  it('returns raw rows on success (caller formats)', async () => {
    execute.mockResolvedValueOnce([{ uuid: 'aaaa-bbbb' }]);
    execute.mockResolvedValueOnce([
      { date: '2026-06-01', price: '9.99', dealId: 'deal-1' },
      { date: '2026-06-02', price: '7.50', dealId: 'deal-2' },
    ]);
    const result = await getDailyPriceHistoryAction('123456', 30);
    expect(result).toEqual([
      { date: '2026-06-01', price: '9.99', dealId: 'deal-1' },
      { date: '2026-06-02', price: '7.50', dealId: 'deal-2' },
    ]);
  });

  it('returns empty and swallows error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execute.mockResolvedValueOnce([{ uuid: 'aaaa-bbbb' }]);
    execute.mockRejectedValueOnce(new Error('boom'));
    expect(await getDailyPriceHistoryAction('123456', 30)).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('getDealsAction', () => {
  it('calls fetchDealsWithFallback with sanitized default params', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    const result = await getDealsAction();
    expect(result).toEqual([]);
    const url = mockFetchDealsWithFallback.mock.calls[0][0] as string;
    expect(url).toContain('sortBy=');
    expect(url).toContain('onSale=1');
    expect(url).toContain('pageSize=20');
  });

  it('passes valid sort parameter through', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ sortBy: 'Savings' });
    expect(mockFetchDealsWithFallback).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=Savings')
    );
  });

  it('defaults sort to Deal Rating for invalid value', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ sortBy: 'InvalidSort' });
    const url = mockFetchDealsWithFallback.mock.calls[0][0] as string;
    expect(url).toContain('sortBy=');
  });

  it('clamps pageSize to 1-100 range', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ pageSize: '0' });
    expect(mockFetchDealsWithFallback).toHaveBeenCalledWith(expect.stringContaining('pageSize=1'));

    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ pageSize: '200' });
    expect(mockFetchDealsWithFallback).toHaveBeenCalledWith(
      expect.stringContaining('pageSize=100')
    );
  });

  it('defaults pageSize to 20 for NaN input', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ pageSize: 'abc' });
    expect(mockFetchDealsWithFallback).toHaveBeenCalledWith(expect.stringContaining('pageSize=20'));
  });

  it('includes optional price and store params when valid', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ upperPrice: '25', lowerPrice: '5', storeID: '1' });
    const url = mockFetchDealsWithFallback.mock.calls[0][0] as string;
    expect(url).toContain('upperPrice=25');
    expect(url).toContain('lowerPrice=5');
    expect(url).toContain('storeID=1');
  });

  it('excludes invalid price and store params', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ upperPrice: 'abc', storeID: '1234' });
    const url = mockFetchDealsWithFallback.mock.calls[0][0] as string;
    expect(url).not.toContain('upperPrice');
    expect(url).not.toContain('storeID');
  });

  it('includes title when provided and short enough', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ title: 'Zelda' });
    expect(mockFetchDealsWithFallback).toHaveBeenCalledWith(expect.stringContaining('title=Zelda'));
  });

  it('excludes title when too long (>200 chars)', async () => {
    mockFetchDealsWithFallback.mockResolvedValueOnce([]);
    await getDealsAction({ title: 'x'.repeat(201) });
    const url = mockFetchDealsWithFallback.mock.calls[0][0] as string;
    expect(url).not.toContain('title=');
  });
});

describe('getStoresAction', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns merged store map from API + hardcoded stores', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { storeID: '1', storeName: 'Steam' },
          { storeID: '7', storeName: 'GOG' },
        ]),
    });
    const result = await getStoresAction();
    expect(result['1']).toBe('Steam');
    expect(result['7']).toBe('GOG');
    expect(result['101']).toBe('CDKeys');
    expect(result['102']).toBe('Kinguin');
    expect(result['103']).toBe('Eneba');
    expect(result['104']).toBe('Gamivo');
  });

  it('returns hardcoded stores when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await getStoresAction();
    expect(result['101']).toBe('CDKeys');
    expect(result['102']).toBe('Kinguin');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns hardcoded stores when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    const result = await getStoresAction();
    expect(result['101']).toBe('CDKeys');
    expect(Object.keys(result)).toHaveLength(4);
  });
});

describe('getGameAction', () => {
  it('delegates to fetchGameDetails with correct args', async () => {
    mockFetchGameDetails.mockResolvedValueOnce({ gameID: '123', name: 'Test Game' });
    const result = await getGameAction('123');
    expect(mockFetchGameDetails).toHaveBeenCalledWith('123', 'getGameAction');
    expect(result).toEqual({ gameID: '123', name: 'Test Game' });
  });

  it('returns null when fetchGameDetails returns null', async () => {
    mockFetchGameDetails.mockResolvedValueOnce(null);
    const result = await getGameAction('999');
    expect(result).toBeNull();
  });
});

describe('ingestPricesAction (success path)', () => {
  it('returns success with counts when deals are ingested', async () => {
    const mockDeals = [{ gameID: '1', dealID: 'd1' }] as Awaited<
      ReturnType<typeof fetchCheapSharkDeals>
    >;
    vi.mocked(fetchCheapSharkDeals).mockResolvedValueOnce(mockDeals);
    vi.mocked(upsertGames).mockResolvedValueOnce(new Map([['1', 'uuid-1']]));
    mockBuildDealsInsertValues.mockReturnValueOnce([
      { gameId: 'uuid-1', storeId: '1', price: 9.99 },
    ]);
    mockBuildPriceHistoryValues.mockReturnValueOnce([{ gameId: 'uuid-1', price: 9.99 }]);

    const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
    mockInsert.mockReturnValueOnce({ values: mockValues });

    const result = await ingestPricesAction();
    expect(result.success).toBe(true);
    expect(result.gamesUpserted).toBe(1);
    expect(result.dealsIngested).toBe(1);
    expect(result.pricesRecorded).toBe(1);
  });

  it('returns success with zeros when no deals fetched', async () => {
    vi.mocked(fetchCheapSharkDeals).mockResolvedValueOnce([]);
    const result = await ingestPricesAction();
    expect(result.success).toBe(true);
    expect(result.dealsIngested).toBe(0);
    expect(result.gamesUpserted).toBe(0);
    expect(result.pricesRecorded).toBe(0);
  });

  it('returns success with zeros when deals is null', async () => {
    vi.mocked(fetchCheapSharkDeals).mockResolvedValueOnce(
      null as unknown as Awaited<ReturnType<typeof fetchCheapSharkDeals>>
    );
    const result = await ingestPricesAction();
    expect(result.success).toBe(true);
  });

  it('returns error with non-Error thrown value', async () => {
    vi.mocked(fetchCheapSharkDeals).mockRejectedValueOnce('string error');
    const result = await ingestPricesAction();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });
});

describe('getDealsFromDBAction', () => {
  it('queries DB with default limit of 20', async () => {
    const mockResult = [{ gameId: 'uuid-1', title: 'Game 1' }];
    const mockLimit = vi.fn().mockResolvedValueOnce(mockResult);
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    });

    const result = await getDealsFromDBAction();
    expect(result).toEqual(mockResult);
    expect(mockLimit).toHaveBeenCalledWith(20);
  });

  it('passes custom limit to query', async () => {
    const mockLimit = vi.fn().mockResolvedValueOnce([]);
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    });

    await getDealsFromDBAction(50);
    expect(mockLimit).toHaveBeenCalledWith(50);
  });
});
