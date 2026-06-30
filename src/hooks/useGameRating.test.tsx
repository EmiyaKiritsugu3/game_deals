// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameAvgRating, useGameRating, useRateGame } from './useGameRating';

const mocks = vi.hoisted(() => ({
  getGameRating: vi.fn(),
  getAvgRating: vi.fn(),
  rateGame: vi.fn(),
}));

vi.mock('@/actions/ratings', () => ({
  getGameRating: mocks.getGameRating,
  getAvgRating: mocks.getAvgRating,
  rateGame: mocks.rateGame,
}));

function createCtx(gcTime = 0) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime },
      mutations: { retry: false },
    },
  });
  const Wrapper = function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
  return { queryClient, Wrapper };
}

describe('useGameRating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user rating for a game', async () => {
    mocks.getGameRating.mockResolvedValue({ rating: 4 });
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameRating('game-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ rating: 4 });
    expect(mocks.getGameRating).toHaveBeenCalledWith('game-1');
  });

  it('returns null when user has not rated', async () => {
    mocks.getGameRating.mockResolvedValue(null);
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameRating('game-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('is disabled without gameId', () => {
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameRating(''), {
      wrapper: Wrapper,
    });

    expect(result.current.isFetching).toBe(false);
    expect(mocks.getGameRating).not.toHaveBeenCalled();
  });
});

describe('useGameAvgRating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches average rating for a game', async () => {
    mocks.getAvgRating.mockResolvedValue({ average: 4.2, count: 10 });
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameAvgRating('game-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ average: 4.2, count: 10 });
    expect(mocks.getAvgRating).toHaveBeenCalledWith('game-1');
  });

  it('returns zero when no ratings', async () => {
    mocks.getAvgRating.mockResolvedValue({ average: 0, count: 0 });
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameAvgRating('game-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ average: 0, count: 0 });
  });

  it('is disabled without gameId', () => {
    const { Wrapper } = createCtx();
    const { result } = renderHook(() => useGameAvgRating(''), {
      wrapper: Wrapper,
    });

    expect(result.current.isFetching).toBe(false);
    expect(mocks.getAvgRating).not.toHaveBeenCalled();
  });
});

describe('useRateGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls rateGame and invalidates queries on success', async () => {
    mocks.rateGame.mockResolvedValue({ id: 'rating-1' });
    const { queryClient, Wrapper } = createCtx();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRateGame('game-1'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(3);
    });

    expect(mocks.rateGame).toHaveBeenCalledWith('game-1', 3);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['game-rating', 'game-1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['game-avg-rating', 'game-1'],
    });
  });

  it('optimistic update sets rating before server responds', async () => {
    // deferred so mutation stays in-flight, letting us check cache before settle
    let deferred!: (v: unknown) => void;
    mocks.rateGame.mockReturnValue(
      new Promise((resolve) => {
        deferred = resolve;
      })
    );
    // ponytail: gcTime=0 (default) causes cancelQueries to drop cache — need non-zero for optimistic check
    const { queryClient, Wrapper } = createCtx(999_999);

    queryClient.setQueryData(['game-rating', 'g1'], { rating: 2 });

    const { result } = renderHook(() => useRateGame('g1'), {
      wrapper: Wrapper,
    });

    // fire mutation; don't await — we want to check mid-flight
    result.current.mutate(5);

    // flush onMutate microtasks (cancelQueries, setQueryData)
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(queryClient.getQueryData(['game-rating', 'g1'])).toEqual({
      rating: 5,
    });

    // resolve the deferred so the mutation settles cleanly
    await act(async () => {
      deferred({ id: 'r1' });
    });
  });

  it('rolls back optimistic update on error', async () => {
    let deferred!: (v: unknown) => void;
    mocks.rateGame.mockReturnValue(
      new Promise((_, reject) => {
        deferred = reject;
      })
    );
    // ponytail: gcTime=0 (default) causes cancelQueries to drop cache — use Infinity here
    const { queryClient, Wrapper } = createCtx(999_999);

    queryClient.setQueryData(['game-rating', 'g1'], { rating: 2 });

    const { result } = renderHook(() => useRateGame('g1'), {
      wrapper: Wrapper,
    });

    result.current.mutate(5);
    // flush TanStack Query microtasks
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(queryClient.getQueryData(['game-rating', 'g1'])).toEqual({
      rating: 5,
    });

    // now reject
    await act(async () => {
      deferred(new Error('fail'));
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(['game-rating', 'g1'])).toEqual({
        rating: 2,
      });
    });
  });
});
