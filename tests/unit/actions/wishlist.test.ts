import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authGetUser, wishlistSelect } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  wishlistSelect: vi.fn(),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => ({
    auth: { getUser: () => authGetUser() },
    from: () => ({
      select: () => wishlistSelect(),
    }),
  }),
}));

vi.mock('@/actions/deals', () => ({
  resolveCheapsharkByUuidsAction: vi.fn(),
}));

import { resolveCheapsharkByUuidsAction } from '@/actions/deals';
import { getUserWishlistAction } from '@/actions/wishlist';

beforeEach(() => {
  authGetUser.mockReset();
  wishlistSelect.mockReset();
  vi.mocked(resolveCheapsharkByUuidsAction).mockReset();
});

describe('getUserWishlistAction', () => {
  it('returns cheapsharkIds for authenticated user', async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    wishlistSelect.mockResolvedValue({
      data: [{ gameId: 'uuid-aaa' }, { gameId: 'uuid-bbb' }],
      error: null,
    });
    vi.mocked(resolveCheapsharkByUuidsAction).mockResolvedValue({
      'uuid-aaa': '111',
      'uuid-bbb': '222',
    });

    const result = await getUserWishlistAction();

    expect(result).toEqual(['111', '222']);
    expect(wishlistSelect).toHaveBeenCalled();
  });

  it('returns empty array when user has no wishlist items', async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    wishlistSelect.mockResolvedValue({ data: [], error: null });

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
    expect(wishlistSelect).not.toHaveBeenCalled();
  });

  it('handles Supabase errors gracefully', async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    wishlistSelect.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const result = await getUserWishlistAction();

    expect(result).toEqual([]);
  });
});
