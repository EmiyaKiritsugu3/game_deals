/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlaylistMutations } from './usePlaylistMutations';

const mocks = vi.hoisted(() => {
  const store: {
    addGameToPlaylistAction: ReturnType<typeof vi.fn>;
    createPlaylistAction: ReturnType<typeof vi.fn>;
    removeGameFromPlaylistAction: ReturnType<typeof vi.fn>;
    deletePlaylistAction: ReturnType<typeof vi.fn>;
    updatePlaylistAction: ReturnType<typeof vi.fn>;
    resolveGameUuid: ReturnType<typeof vi.fn>;
    invalidateMock: ReturnType<typeof vi.fn>;
    user: { id: string } | null;
  } = {
    addGameToPlaylistAction: vi.fn(),
    createPlaylistAction: vi.fn(),
    removeGameFromPlaylistAction: vi.fn(),
    deletePlaylistAction: vi.fn(),
    updatePlaylistAction: vi.fn(),
    resolveGameUuid: vi.fn(),
    invalidateMock: vi.fn(),
    user: null,
  };
  return store;
});

vi.mock('@/actions/playlists', () => ({
  addGameToPlaylistAction: mocks.addGameToPlaylistAction,
  createPlaylistAction: mocks.createPlaylistAction,
  removeGameFromPlaylistAction: mocks.removeGameFromPlaylistAction,
  deletePlaylistAction: mocks.deletePlaylistAction,
  updatePlaylistAction: mocks.updatePlaylistAction,
}));

vi.mock('@/actions/deals', () => ({
  resolveGameUuid: mocks.resolveGameUuid,
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

  it('returns all mutations', () => {
    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.addMutation).toBeDefined();
    expect(result.current.createMutation).toBeDefined();
    expect(result.current.removeGameMutation).toBeDefined();
    expect(result.current.deletePlaylistMutation).toBeDefined();
    expect(result.current.updatePlaylistMutation).toBeDefined();
  });

  it('addMutation calls addGameToPlaylistAction after resolving gameId', async () => {
    mocks.resolveGameUuid.mockResolvedValue('g1-uuid');
    mocks.addGameToPlaylistAction.mockResolvedValue(true);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.addMutation.mutate('playlist-1');
    });

    expect(mocks.resolveGameUuid).toHaveBeenCalledWith('g1');
    expect(mocks.addGameToPlaylistAction).toHaveBeenCalledWith('playlist-1', 'g1');
  });

  it('addMutation invalidates playlists on success', async () => {
    mocks.resolveGameUuid.mockResolvedValue('g1-uuid');
    mocks.addGameToPlaylistAction.mockResolvedValue(true);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.addMutation.mutate('p1');
    });

    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });

  it('creatMutation throws when no user', async () => {
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
    expect(mocks.createPlaylistAction).not.toHaveBeenCalled();
  });

  it('creatMutation creates playlist and adds game when user exists', async () => {
    mocks.user = { id: 'user-1' };
    mocks.createPlaylistAction.mockResolvedValue({ id: 'new-list' });
    mocks.addGameToPlaylistAction.mockResolvedValue(true);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.createMutation.mutate('My List');
    });

    expect(mocks.createPlaylistAction).toHaveBeenCalledWith('user-1', 'My List');
    expect(mocks.addGameToPlaylistAction).toHaveBeenCalledWith('new-list', 'g1');
    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });

  it('removeGameMutation calls removeGameFromPlaylistAction', async () => {
    mocks.removeGameFromPlaylistAction.mockResolvedValue(true);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.removeGameMutation.mutate({ playlistId: 'p1', gameId: 'g1-uuid' });
    });

    expect(mocks.removeGameFromPlaylistAction).toHaveBeenCalledWith('p1', 'g1-uuid');
    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });

  it('deletePlaylistMutation calls deletePlaylistAction', async () => {
    mocks.deletePlaylistAction.mockResolvedValue(true);

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.deletePlaylistMutation.mutate('p1');
    });

    expect(mocks.deletePlaylistAction).toHaveBeenCalledWith('p1');
    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });

  it('updatePlaylistMutation calls updatePlaylistAction', async () => {
    mocks.updatePlaylistAction.mockResolvedValue({ id: 'p1' });

    const { result } = renderHook(() => usePlaylistMutations('g1'), {
      wrapper: createWrapper(),
    });

    const data = { title: 'New Title', isPublic: true };
    await act(async () => {
      result.current.updatePlaylistMutation.mutate({ id: 'p1', data });
    });

    expect(mocks.updatePlaylistAction).toHaveBeenCalledWith('p1', data);
    expect(mocks.invalidateMock).toHaveBeenCalledWith({ queryKey: ['playlists'] });
  });
});
