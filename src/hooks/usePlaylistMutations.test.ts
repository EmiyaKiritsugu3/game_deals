/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistMutations } from './usePlaylistMutations';

const mocks = vi.hoisted(() => ({
  addGameToPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
  invalidateMock: vi.fn(),
  user: null as { id: string } | null,
}));

vi.mock('@/services/social', () => ({
  addGameToPlaylist: mocks.addGameToPlaylist,
  createPlaylist: mocks.createPlaylist,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateMock }),
  };
});

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePlaylistMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = null;
  });

  it('returns addMutation and createMutation', () => {
    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.addMutation).toBeDefined();
    expect(result.current.createMutation).toBeDefined();
  });

  it('addMutation calls addGameToPlaylist with playlistId', async () => {
    mocks.addGameToPlaylist.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.addMutation.mutate('playlist-1');
    });

    expect(mocks.addGameToPlaylist).toHaveBeenCalledWith('playlist-1', 'g1');
  });

  it('addMutation invalidates playlists on success', async () => {
    mocks.addGameToPlaylist.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.addMutation.mutate('p1');
    });

    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });

  it('createMutation throws when no user', async () => {
    mocks.user = null;

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.createMutation.mutate('My Playlist');
    });

    await waitFor(() => {
      expect(result.current.createMutation.isError).toBe(true);
    });

    expect(result.current.createMutation.error).toBeDefined();
    expect((result.current.createMutation.error as Error).message).toBe('Unauthenticated');
    expect(mocks.createPlaylist).not.toHaveBeenCalled();
  });

  it('createMutation creates playlist and adds game when user exists', async () => {
    mocks.user = { id: 'user-1' };
    mocks.createPlaylist.mockResolvedValue({ id: 'new-list' });
    mocks.addGameToPlaylist.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.createMutation.mutate('My List');
    });

    expect(mocks.createPlaylist).toHaveBeenCalledWith('user-1', 'My List');
    expect(mocks.addGameToPlaylist).toHaveBeenCalledWith('new-list', 'g1');
    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });
});
