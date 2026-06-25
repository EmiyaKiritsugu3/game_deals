import { beforeEach, describe, expect, it, vi } from 'vitest';

const { select, insert, authGetUser } = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  authGetUser: vi.fn(),
}));

function dbThen(end: () => unknown) {
  return new Proxy({} as Record<string, unknown>, {
    get(_, prop: string | symbol) {
      if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(end());
      return () => dbThen(end);
    },
  });
}

vi.mock('@/db', () => ({
  db: {
    select: () => dbThen(() => select()),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: () => insert(),
        }),
      }),
    }),
  },
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

import { getAvgRating, getGameRating, rateGame } from './ratings';

beforeEach(() => {
  select.mockReset();
  insert.mockReset();
  authGetUser.mockReset();
});

describe('rateGame', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(rateGame('game-1', 4)).rejects.toThrow('Unauthorized');
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws on rating < 1', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    await expect(rateGame('game-1', 0)).rejects.toThrow(
      'Rating must be an integer between 1 and 5'
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws on rating > 5', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    await expect(rateGame('game-1', 6)).rejects.toThrow(
      'Rating must be an integer between 1 and 5'
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('throws on non-integer rating', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    await expect(rateGame('game-1', 2.5)).rejects.toThrow(
      'Rating must be an integer between 1 and 5'
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('inserts new rating and returns id', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    insert.mockResolvedValueOnce([{ id: 'rating-1' }]);
    const result = await rateGame('game-1', 4);
    expect(result).toEqual({ id: 'rating-1' });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('upserts when rating already exists', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    insert.mockResolvedValueOnce([{ id: 'rating-1' }]);
    const result = await rateGame('game-1', 2);
    expect(result).toEqual({ id: 'rating-1' });
    expect(insert).toHaveBeenCalledTimes(1);
  });
});

describe('getGameRating', () => {
  it('returns null when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getGameRating('game-1');
    expect(result).toBeNull();
    expect(select).not.toHaveBeenCalled();
  });

  it('returns null when user has not rated game', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    select.mockResolvedValueOnce([]);
    const result = await getGameRating('game-1');
    expect(result).toBeNull();
  });

  it('returns rating when user has rated game', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    select.mockResolvedValueOnce([{ rating: 5 }]);
    const result = await getGameRating('game-1');
    expect(result).toEqual({ rating: 5 });
  });
});

describe('getAvgRating', () => {
  it('returns zero average and count when no ratings', async () => {
    select.mockResolvedValueOnce([{ average: 0, count: 0 }]);
    const result = await getAvgRating('game-1');
    expect(result).toEqual({ average: 0, count: 0 });
  });

  it('computes average correctly', async () => {
    select.mockResolvedValueOnce([{ average: 4.2, count: 10 }]);
    const result = await getAvgRating('game-1');
    expect(result).toEqual({ average: 4.2, count: 10 });
  });

  it('returns integer count', async () => {
    select.mockResolvedValueOnce([{ average: 3, count: 1 }]);
    const result = await getAvgRating('game-1');
    expect(result).toEqual({ average: 3, count: 1 });
  });
});
