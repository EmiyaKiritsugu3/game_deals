// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResolveGameUuidsAction, mockGetBrowserClient, mockCaptureException } = vi.hoisted(
  () => ({
    mockResolveGameUuidsAction: vi.fn(),
    mockGetBrowserClient: vi.fn(),
    mockCaptureException: vi.fn(),
  })
);

vi.mock('@/actions/deals', () => ({
  resolveGameUuidsAction: (...args: unknown[]) => mockResolveGameUuidsAction(...args),
}));

vi.mock('@/lib/supabase-browser', () => ({
  getBrowserClient: (...args: unknown[]) => mockGetBrowserClient(...args),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

let mockUser: { id: string } | null = null;
let mockIsLoggedIn = false;
let mockWishlist: string[] = [];

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({ user: mockUser, isLoggedIn: mockIsLoggedIn }),
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => ({ wishlist: mockWishlist }),
}));

import { useWishlistSync } from './useSyncHooks';

function refMounted(): RefObject<boolean> {
  const r = createRef<boolean>();
  (r as { current: boolean }).current = true;
  return r as RefObject<boolean>;
}

function refNotMounted(): RefObject<boolean> {
  const r = createRef<boolean>();
  (r as { current: boolean }).current = false;
  return r as RefObject<boolean>;
}

describe('useWishlistSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUser = null;
    mockIsLoggedIn = false;
    mockWishlist = [];
    mockGetBrowserClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does nothing when not logged in', () => {
    mockUser = null;
    mockIsLoggedIn = false;
    mockWishlist = ['1', '2'];

    renderHook(() => useWishlistSync(refMounted()));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResolveGameUuidsAction).not.toHaveBeenCalled();
  });

  it('does nothing when user is null', () => {
    mockUser = null;
    mockIsLoggedIn = true;
    mockWishlist = ['1', '2'];

    renderHook(() => useWishlistSync(refMounted()));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResolveGameUuidsAction).not.toHaveBeenCalled();
  });

  it('does nothing when hasMounted is false', () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['1', '2'];

    renderHook(() => useWishlistSync(refNotMounted()));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResolveGameUuidsAction).not.toHaveBeenCalled();
  });

  it('does nothing when wishlist is empty', () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = [];

    renderHook(() => useWishlistSync(refMounted()));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockResolveGameUuidsAction).not.toHaveBeenCalled();
  });

  it('syncs wishlist to supabase after 1s delay', async () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['111', '222'];
    mockResolveGameUuidsAction.mockResolvedValue({
      '111': 'uuid-1',
      '222': 'uuid-2',
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockGetBrowserClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
    });

    renderHook(() => useWishlistSync(refMounted()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockResolveGameUuidsAction).toHaveBeenCalledWith(['111', '222']);
    expect(mockGetBrowserClient).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      [
        { userId: 'u1', gameId: 'uuid-1' },
        { userId: 'u1', gameId: 'uuid-2' },
      ],
      { onConflict: 'userId,gameId' }
    );
  });

  it('does nothing when resolveGameUuidsAction returns empty map', async () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['111'];
    mockResolveGameUuidsAction.mockResolvedValue({});

    renderHook(() => useWishlistSync(refMounted()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockResolveGameUuidsAction).toHaveBeenCalledWith(['111']);
    expect(mockGetBrowserClient).not.toHaveBeenCalled();
  });

  it('captures Sentry exception on sync error', async () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['111'];
    const syncError = new Error('network failure');
    mockResolveGameUuidsAction.mockRejectedValue(syncError);

    renderHook(() => useWishlistSync(refMounted()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockCaptureException).toHaveBeenCalledWith(syncError);
  });

  it('cleans up timer on unmount before it fires', async () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['111'];
    mockResolveGameUuidsAction.mockResolvedValue({ '111': 'uuid-1' });

    const { unmount } = renderHook(() => useWishlistSync(refMounted()));
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockResolveGameUuidsAction).not.toHaveBeenCalled();
  });

  it('syncs correctly when all conditions are met (happy path full)', async () => {
    mockUser = { id: 'u42' };
    mockIsLoggedIn = true;
    mockWishlist = ['aaa', 'bbb', 'ccc'];
    mockResolveGameUuidsAction.mockResolvedValue({
      aaa: 'uuid-a',
      bbb: 'uuid-b',
      ccc: 'uuid-c',
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockGetBrowserClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
    });

    renderHook(() => useWishlistSync(refMounted()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      [
        { userId: 'u42', gameId: 'uuid-a' },
        { userId: 'u42', gameId: 'uuid-b' },
        { userId: 'u42', gameId: 'uuid-c' },
      ],
      { onConflict: 'userId,gameId' }
    );
  });

  it('returns early when supabase upsert fails', async () => {
    mockUser = { id: 'u1' };
    mockIsLoggedIn = true;
    mockWishlist = ['111'];
    mockResolveGameUuidsAction.mockResolvedValue({ '111': 'uuid-1' });

    const upsertError = new Error('upsert failed');
    mockGetBrowserClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ upsert: vi.fn().mockRejectedValue(upsertError) }),
    });

    renderHook(() => useWishlistSync(refMounted()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mockCaptureException).toHaveBeenCalledWith(upsertError);
  });
});
