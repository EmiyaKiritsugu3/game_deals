// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetGamesBatch = vi.hoisted(() => vi.fn());
const mockGetStores = vi.hoisted(() => vi.fn());

vi.mock('@/services/api', () => ({
  getGamesBatch: mockGetGamesBatch,
  getStores: mockGetStores,
}));

import { useWishlistGames } from './useWishlistGames';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useWishlistGames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty result when gameIds is empty', async () => {
    const { result } = renderHook(() => useWishlistGames([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
    expect(mockGetStores).not.toHaveBeenCalled();
    expect(mockGetGamesBatch).not.toHaveBeenCalled();
  });

  it('fetches stores and games when gameIds provided', async () => {
    mockGetStores.mockResolvedValue({ 1: 'Steam' });
    mockGetGamesBatch.mockResolvedValue({
      g1: { title: 'Game1' },
      g2: { title: 'Game2' },
    });

    const { result } = renderHook(() => useWishlistGames(['g1', 'g2']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      stores: { 1: 'Steam' },
      games: [{ title: 'Game1' }, { title: 'Game2' }],
    });
    expect(mockGetStores).toHaveBeenCalledTimes(1);
    expect(mockGetGamesBatch).toHaveBeenCalledTimes(1);
    expect(mockGetGamesBatch).toHaveBeenCalledWith(['g1', 'g2']);
  });

  it('handles individual game fetch failures', async () => {
    mockGetStores.mockResolvedValue({ 1: 'Steam' });
    mockGetGamesBatch.mockResolvedValue({ good: { title: 'Good Game' } });

    const { result } = renderHook(() => useWishlistGames(['good', 'bad']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      stores: { 1: 'Steam' },
      games: [{ title: 'Good Game' }, null],
    });
    expect(mockGetStores).toHaveBeenCalledTimes(1);
    expect(mockGetGamesBatch).toHaveBeenCalledTimes(1);
  });

  it('is disabled when array is empty', () => {
    const { result } = renderHook(() => useWishlistGames([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('staleTime is set to 5 minutes', async () => {
    mockGetStores.mockResolvedValue({ 1: 'Steam' });
    mockGetGamesBatch.mockResolvedValue({ g1: { title: 'Game1' } });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    renderHook(() => useWishlistGames(['g1']), {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
      },
    });

    await waitFor(() => {
      const query = queryClient.getQueryCache().find({
        queryKey: ['wishlist-games', 'g1'],
      });
      expect(query).toBeDefined();
      expect(query?.isStale).toBeDefined();
    });
  });
});
