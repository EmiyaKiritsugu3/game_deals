/**
 * @vitest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface WishlistState {
  wishlist: string[];
  setWishlist: (ids: string[]) => void;
  _cloudSynced: boolean;
}

const mockWishlist = {
  wishlist: [] as string[],
  setWishlist: vi.fn(),
  _cloudSynced: false,
};

const mocks = vi.hoisted(() => ({
  getUserWishlistAction: vi.fn(),
  authUser: null as { id: string } | null,
  authIsLoggedIn: false,
  resolveGameUuidsAction: vi.fn(),
  supabaseUpsert: vi.fn(),
}));

vi.mock('zustand/middleware', () => ({
  persist: (config: unknown, _options: Record<string, unknown>) => config,
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({
    user: mocks.authUser,
    isLoggedIn: mocks.authIsLoggedIn,
  }),
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => mockWishlist as unknown as WishlistState,
}));

vi.mock('@/actions/wishlist', () => ({
  getUserWishlistAction: (...args: unknown[]) =>
    (mocks.getUserWishlistAction as (...a: unknown[]) => unknown)(...args),
}));

vi.mock('@/actions/deals', () => ({
  resolveGameUuidsAction: (...args: unknown[]) =>
    (mocks.resolveGameUuidsAction as (...a: unknown[]) => unknown)(...args),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: () => {
    const upsert = mocks.supabaseUpsert;
    return {
      from: () => ({
        upsert: upsert,
      }),
    };
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  mockWishlist.wishlist = [];
  mockWishlist._cloudSynced = false;
  mockWishlist.setWishlist.mockReset();
  mocks.authUser = null;
  mocks.authIsLoggedIn = false;
  mocks.getUserWishlistAction.mockReset();
  mocks.resolveGameUuidsAction.mockReset();
  mocks.supabaseUpsert.mockReset();
});

describe('SyncManager cloud→local wishlist sync', () => {
  it('fetches cloud wishlist on login and calls setWishlist', async () => {
    mocks.authUser = { id: 'user-123' };
    mocks.authIsLoggedIn = true;
    mocks.getUserWishlistAction.mockResolvedValue(['111', '222']);

    const SyncManager = (await import('@/components/SyncManager')).default;
    render(<SyncManager />);

    await waitFor(
      () => {
        expect(mocks.getUserWishlistAction).toHaveBeenCalled();
        expect(mockWishlist.setWishlist).toHaveBeenCalledWith(['111', '222']);
      },
      { timeout: 3000 }
    );
  });

  it('does not fetch cloud wishlist when user is not logged in', async () => {
    mocks.authIsLoggedIn = false;

    const SyncManager = (await import('@/components/SyncManager')).default;
    render(<SyncManager />);

    await new Promise((r) => setTimeout(r, 100));
    expect(mocks.getUserWishlistAction).not.toHaveBeenCalled();
    expect(mockWishlist.setWishlist).not.toHaveBeenCalled();
  });

  it('merges cloud wishlist with existing local wishlist', async () => {
    mocks.authUser = { id: 'user-123' };
    mocks.authIsLoggedIn = true;
    mockWishlist.wishlist = ['local-item'];
    mocks.getUserWishlistAction.mockResolvedValue(['111', '222']);

    const SyncManager = (await import('@/components/SyncManager')).default;
    render(<SyncManager />);

    await waitFor(
      () => {
        expect(mocks.getUserWishlistAction).toHaveBeenCalled();
        const calls = mockWishlist.setWishlist.mock.calls[0]?.[0] ?? [];
        expect(calls).toContain('local-item');
        expect(calls).toContain('111');
        expect(calls).toContain('222');
      },
      { timeout: 3000 }
    );
  });

  it('only syncs cloud→local once per login session', async () => {
    mocks.authUser = { id: 'user-123' };
    mocks.authIsLoggedIn = true;
    mocks.getUserWishlistAction.mockResolvedValue(['111']);

    const SyncManager = (await import('@/components/SyncManager')).default;
    const { rerender } = render(<SyncManager />);

    await waitFor(() => {
      expect(mocks.getUserWishlistAction).toHaveBeenCalledTimes(1);
    });

    // Rerender with same auth state should not trigger another sync
    rerender(<SyncManager />);

    await new Promise((r) => setTimeout(r, 100));
    expect(mocks.getUserWishlistAction).toHaveBeenCalledTimes(1);
  });
});
