import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authGetUser, dbExecute } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  dbExecute: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => authGetUser() },
    }),
}));

vi.mock('@/db', () => ({
  db: { execute: dbExecute },
}));

vi.mock('@/actions/deals', () => ({
  resolveCheapsharkByUuidsAction: vi.fn(),
}));

import { resolveCheapsharkByUuidsAction } from '@/actions/deals';
import { getUserWishlistAction } from '@/actions/wishlist';

beforeEach(() => {
  authGetUser.mockReset();
  dbExecute.mockReset();
  vi.mocked(resolveCheapsharkByUuidsAction).mockReset();
});

describe('getUserWishlistAction', () => {
  it('returns cheapsharkIds for authenticated user with userId filter', async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    dbExecute.mockResolvedValue([{ gameId: 'uuid-aaa' }, { gameId: 'uuid-bbb' }]);
    vi.mocked(resolveCheapsharkByUuidsAction).mockResolvedValue({
      'uuid-aaa': '111',
      'uuid-bbb': '222',
    });

    const result = await getUserWishlistAction();

    expect(result).toEqual(['111', '222']);
    expect(dbExecute).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when user has no wishlist items', async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    dbExecute.mockResolvedValue([]);

    const result = await getUserWishlistAction();

    expect(result).toEqual([]);
  });

  it('returns empty array when user is not authenticated', async () => {
    authGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getUserWishlistAction();

    expect(result).toEqual([]);
    expect(dbExecute).not.toHaveBeenCalled();
  });

  it('handles auth errors gracefully', async () => {
    authGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await getUserWishlistAction();

    expect(result).toEqual([]);
    expect(dbExecute).not.toHaveBeenCalled();
  });
});
