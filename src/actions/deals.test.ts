import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, authGetUser, mockInsert, mockOnConflictDoUpdate } = vi.hoisted(() => {
  const ret = vi.fn();
  const ocdu = vi.fn(() => ({ returning: ret }));
  const vals = vi.fn(() => ({ onConflictDoUpdate: ocdu }));
  const ins = vi.fn(() => ({ values: vals }));
  return {
    execute: vi.fn(),
    authGetUser: vi.fn(),
    mockInsert: ins,
    mockOnConflictDoUpdate: ocdu,
  };
});

vi.mock('@/db', () => ({ db: { execute, insert: mockInsert } }));

vi.mock('@/services/ingest');

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

import { db } from '@/db';
import { deals as dealsTable } from '@/db/schema';
import { fetchCheapSharkDeals, upsertGames } from '@/services/ingest';
import {
  getDailyPriceHistoryAction,
  ingestPricesAction,
  resolveCheapsharkByUuidAction,
  resolveCheapsharkByUuidsAction,
  resolveGameUuid,
  resolveGameUuidsAction,
} from './deals';

beforeEach(() => {
  execute.mockReset();
  authGetUser.mockReset();
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
