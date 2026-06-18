// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserPlaylistsAction: vi.fn(),
  getPlaylistByIdAction: vi.fn(),
  invalidateMock: vi.fn(),
}));

vi.mock('@/actions/playlists', () => ({
  getUserPlaylistsAction: mocks.getUserPlaylistsAction,
  getPlaylistByIdAction: mocks.getPlaylistByIdAction,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateMock }),
  };
});

import { usePlaylistDetail, usePlaylists } from '@/hooks/usePlaylists';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePlaylists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user playlists', async () => {
    const fakePlaylists = [
      { id: 'p1', title: 'List A', gameCount: 5 },
      { id: 'p2', title: 'List B', gameCount: 3 },
    ];
    mocks.getUserPlaylistsAction.mockResolvedValueOnce(fakePlaylists);

    const { result } = renderHook(() => usePlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(fakePlaylists);
    expect(mocks.getUserPlaylistsAction).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no playlists', async () => {
    mocks.getUserPlaylistsAction.mockResolvedValueOnce([]);

    const { result } = renderHook(() => usePlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('usePlaylistDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches playlist detail with games', async () => {
    const fakeDetail = {
      id: 'p1',
      title: 'My List',
      games: [
        { gameId: 'g1', cheapsharkId: '123', title: 'Game A' },
      ],
    };
    mocks.getPlaylistByIdAction.mockResolvedValueOnce(fakeDetail);

    const { result } = renderHook(() => usePlaylistDetail('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(fakeDetail);
    expect(mocks.getPlaylistByIdAction).toHaveBeenCalledWith('p1');
  });

  it('returns null when playlist not found', async () => {
    mocks.getPlaylistByIdAction.mockResolvedValueOnce(null);

    const { result } = renderHook(() => usePlaylistDetail('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('is disabled when id is falsy', () => {
    const { result } = renderHook(() => usePlaylistDetail(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });
});
