// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDailyPriceHistoryAction = vi.hoisted(() => vi.fn());

vi.mock('@/actions/deals', () => ({
  getDailyPriceHistoryAction,
}));

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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const { useDailyPriceHistory } = await import('./usePriceHistory');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDailyPriceHistory', () => {
  it('returns data when gameId is provided', async () => {
    const mockData = [{ date: '2026-06-01', price: '9.99' }];
    getDailyPriceHistoryAction.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDailyPriceHistory('123'), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(getDailyPriceHistoryAction).toHaveBeenCalledWith('123', 90);
  });

  it('is disabled when gameId is null', () => {
    const { result } = renderHook(() => useDailyPriceHistory(null), {
      wrapper: createWrapper(),
    });

    expect(getDailyPriceHistoryAction).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('is disabled when gameId is empty string', () => {
    const { result } = renderHook(() => useDailyPriceHistory(''), {
      wrapper: createWrapper(),
    });

    expect(getDailyPriceHistoryAction).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('uses default days=90', async () => {
    getDailyPriceHistoryAction.mockResolvedValue([]);

    const { result } = renderHook(() => useDailyPriceHistory('123'), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDailyPriceHistoryAction).toHaveBeenCalledWith('123', 90);
  });

  it('uses custom days', async () => {
    getDailyPriceHistoryAction.mockResolvedValue([]);

    const { result } = renderHook(() => useDailyPriceHistory('123', 30), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDailyPriceHistoryAction).toHaveBeenCalledWith('123', 30);
  });

  it('updates when gameId changes', async () => {
    getDailyPriceHistoryAction.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ gameId, days }: { gameId: string | null; days?: number }) =>
        useDailyPriceHistory(gameId, days),
      {
        initialProps: { gameId: '1' },
        wrapper: createWrapper(),
      }
    );

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDailyPriceHistoryAction).toHaveBeenCalledTimes(1);
    expect(getDailyPriceHistoryAction).toHaveBeenCalledWith('1', 90);

    getDailyPriceHistoryAction.mockResolvedValue([]);

    rerender({ gameId: '2' });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDailyPriceHistoryAction).toHaveBeenCalledTimes(2);
    expect(getDailyPriceHistoryAction).toHaveBeenCalledWith('2', 90);
  });
});
