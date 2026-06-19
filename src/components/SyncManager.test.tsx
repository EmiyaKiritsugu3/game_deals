// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyncManager from './SyncManager';

// -- shared mock state (mutable across test cases and renders) --
const mockGetUserWishlistAction = vi.fn<() => Promise<string[]>>();
let mockAuthState: { user: { id: string } | null; isLoggedIn: boolean };
let mockWishlistState: { wishlist: string[]; setWishlist: ReturnType<typeof vi.fn> };

vi.mock('@/actions/wishlist', () => ({
  getUserWishlistAction: () => mockGetUserWishlistAction(),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => mockWishlistState,
}));

vi.mock('@/hooks/useSyncHooks', () => ({
  useWishlistSync: vi.fn(),
}));

describe('SyncManager — cloud→local wishlist hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: null, isLoggedIn: false };
    mockWishlistState = { wishlist: [], setWishlist: vi.fn() };
    mockGetUserWishlistAction.mockResolvedValue([]);
  });

  it('loads wishlist from cloud once when user is logged in', async () => {
    mockAuthState = { user: { id: 'u1' }, isLoggedIn: true };
    mockGetUserWishlistAction.mockResolvedValue(['cs-1', 'cs-2']);

    render(<SyncManager />);

    expect(mockGetUserWishlistAction).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockWishlistState.setWishlist).toHaveBeenCalledWith(['cs-1', 'cs-2']);
    });
  });

  it('does not load wishlist when user is not logged in', () => {
    render(<SyncManager />);

    expect(mockGetUserWishlistAction).not.toHaveBeenCalled();
    expect(mockWishlistState.setWishlist).not.toHaveBeenCalled();
  });

  it('merges local wishlist with cloud wishlist', async () => {
    mockAuthState = { user: { id: 'u1' }, isLoggedIn: true };
    mockWishlistState = { wishlist: ['local-1'], setWishlist: vi.fn() };
    mockGetUserWishlistAction.mockResolvedValue(['cs-1', 'cs-2']);

    render(<SyncManager />);

    await waitFor(() => {
      expect(mockWishlistState.setWishlist).toHaveBeenCalledWith(
        expect.arrayContaining(['local-1', 'cs-1', 'cs-2'])
      );
    });
    // Verify exactly the merged set (order-independent)
    await waitFor(() => {
      const call = mockWishlistState.setWishlist.mock.calls[0]?.[0] as string[];
      expect(new Set(call)).toEqual(new Set(['local-1', 'cs-1', 'cs-2']));
    });
  });

  it('resets the load guard on logout so next login re-loads', async () => {
    mockAuthState = { user: { id: 'u1' }, isLoggedIn: true };
    mockGetUserWishlistAction.mockResolvedValue(['cs-1']);

    const { rerender } = render(<SyncManager />);

    await waitFor(() => {
      expect(mockGetUserWishlistAction).toHaveBeenCalledTimes(1);
    });

    // Simulate logout
    mockAuthState = { user: null, isLoggedIn: false };
    rerender(<SyncManager />);

    // Simulate re-login
    mockAuthState = { user: { id: 'u1' }, isLoggedIn: true };
    rerender(<SyncManager />);

    await waitFor(() => {
      expect(mockGetUserWishlistAction).toHaveBeenCalledTimes(2);
    });
  });

  it('does not call setWishlist when cloud wishlist is empty', async () => {
    mockAuthState = { user: { id: 'u1' }, isLoggedIn: true };
    mockGetUserWishlistAction.mockResolvedValue([]);

    render(<SyncManager />);

    // Allow the async effect to complete
    await vi.waitFor(() => {
      expect(mockGetUserWishlistAction).toHaveBeenCalledTimes(1);
    });

    expect(mockWishlistState.setWishlist).not.toHaveBeenCalled();
  });
});
