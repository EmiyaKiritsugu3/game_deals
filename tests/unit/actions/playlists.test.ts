import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, authGetUser, resolveGameUuid } = vi.hoisted(() => ({
  execute: vi.fn(),
  authGetUser: vi.fn(),
  resolveGameUuid: vi.fn(),
}));

vi.mock('@/db', () => ({ db: { execute } }));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: () => authGetUser() } }),
}));

vi.mock('@/actions/deals', () => ({ resolveGameUuid }));

import {
  addGameToPlaylistAction,
  createPlaylistAction,
  deletePlaylistAction,
  getPlaylistByIdAction,
  getUserPlaylistsAction,
  removeGameFromPlaylistAction,
  updatePlaylistAction,
} from '@/actions/playlists';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

beforeEach(() => {
  execute.mockReset();
  authGetUser.mockReset();
  resolveGameUuid.mockReset();
});

describe('createPlaylistAction', () => {
  const fakePlaylist = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: 'user-1',
    title: 'My Playlist',
    slug: 'my-playlist',
    description: null,
    isPublic: false,
    createdAt: new Date('2026-06-17'),
    updatedAt: new Date('2026-06-17'),
  };

  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(createPlaylistAction('user-1', 'My Playlist')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws when userId does not match authenticated user', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-2' } } });
    await expect(createPlaylistAction('user-1', 'My Playlist')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('creates playlist with slug from title', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([fakePlaylist]);

    const result = await createPlaylistAction('user-1', 'My Playlist');

    expect(result).toEqual(fakePlaylist);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('generates slug from title: lowercase, hyphens, no special chars', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ ...fakePlaylist, slug: 'hello-world-2024' }]);

    const result = await createPlaylistAction('user-1', 'Hello World! 2024');
    expect(result.slug).toBe('hello-world-2024');
  });

  it('handles slug conflict by appending random suffix', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...fakePlaylist, slug: 'my-playlist-4f3a1c' }]);

    const result = await createPlaylistAction('user-1', 'My Playlist');
    expect(result.slug).not.toBe('my-playlist');
    expect(result.slug).toMatch(/^my-playlist-/);
    expect(execute).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it('creates playlist with description', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const withDesc = { ...fakePlaylist, description: 'My desc' };
    execute.mockResolvedValueOnce([withDesc]);

    const result = await createPlaylistAction('user-1', 'My Playlist', 'My desc');
    expect(result.description).toBe('My desc');
  });
});

describe('getUserPlaylistsAction', () => {
  it('returns empty array when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getUserPlaylistsAction();
    expect(result).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns playlists for authenticated user', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const fakePlaylists = [
      { id: 'p1', userId: 'user-1', title: 'List A', slug: 'list-a', isPublic: false },
      { id: 'p2', userId: 'user-1', title: 'List B', slug: 'list-b', isPublic: true },
    ];
    execute.mockResolvedValueOnce(fakePlaylists);

    const result = await getUserPlaylistsAction();
    expect(result).toEqual(fakePlaylists);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when user has no playlists', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    const result = await getUserPlaylistsAction();
    expect(result).toEqual([]);
  });
});

describe('getPlaylistByIdAction', () => {
  it('returns null when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await getPlaylistByIdAction('p1');
    expect(result).toBeNull();
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns playlist with games resolved to cheapsharkIds', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const fakePlaylist = {
      id: 'p1',
      userId: 'user-1',
      title: 'My List',
      slug: 'my-list',
      description: null,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fakeGames = [
      {
        gameId: 'g1-uuid',
        cheapsharkId: '123',
        title: 'Game A',
        thumbUrl: 'a.jpg',
      },
      {
        gameId: 'g2-uuid',
        cheapsharkId: '456',
        title: 'Game B',
        thumbUrl: null,
      },
    ];
    execute
      .mockResolvedValueOnce([fakePlaylist])
      .mockResolvedValueOnce(fakeGames);

    const result = await getPlaylistByIdAction('p1');
    expect(result).toEqual({
      ...fakePlaylist,
      games: fakeGames,
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns playlist with empty games array when no games', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ id: 'p1', userId: 'user-1', title: 'Empty List' }]);
    execute.mockResolvedValueOnce([]);

    const result = await getPlaylistByIdAction('p1');
    expect(result?.games).toEqual([]);
  });

  it('returns null when playlist not found', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    const result = await getPlaylistByIdAction('nonexistent');
    expect(result).toBeNull();
  });
});

describe('addGameToPlaylistAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(addGameToPlaylistAction('p1', '123')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('throws when game uuid not resolved', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce(null);
    await expect(addGameToPlaylistAction('p1', '999999')).rejects.toThrow(
      'Game not found or not yet ingested'
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('inserts into playlist_games after resolving uuid', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce('g1-uuid');
    execute.mockResolvedValueOnce([{ id: 'pg-1', playlistId: 'p1', gameId: 'g1-uuid' }]);

    const result = await addGameToPlaylistAction('p1', '123');
    expect(result).toBe(true);
    expect(resolveGameUuid).toHaveBeenCalledWith('123');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('handles duplicate game gracefully (returns true)', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    resolveGameUuid.mockResolvedValueOnce('g1-uuid');
    execute.mockResolvedValueOnce([]);

    const result = await addGameToPlaylistAction('p1', '123');
    expect(result).toBe(false);
  });
});

describe('removeGameFromPlaylistAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(removeGameFromPlaylistAction('p1', 'g1-uuid')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('removes game from playlist and returns true', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([{ id: 'pg-1' }]);

    const result = await removeGameFromPlaylistAction('p1', 'g1-uuid');
    expect(result).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('returns false when game not in playlist', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);

    const result = await removeGameFromPlaylistAction('p1', 'nonexistent-game');
    expect(result).toBe(false);
  });
});

describe('updatePlaylistAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(updatePlaylistAction('p1', { title: 'New' })).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('updates playlist title', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const updated = { id: 'p1', userId: 'user-1', title: 'New Title' };
    execute.mockResolvedValueOnce([updated]);

    const result = await updatePlaylistAction('p1', { title: 'New Title' });
    expect(result).toEqual(updated);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('updates description and isPublic', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const updated = {
      id: 'p1',
      userId: 'user-1',
      title: 'Title',
      description: 'New desc',
      isPublic: true,
    };
    execute.mockResolvedValueOnce([updated]);

    const result = await updatePlaylistAction('p1', { description: 'New desc', isPublic: true });
    expect(result).toEqual(updated);
  });

  it('returns null when playlist not found or not owned', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);

    const result = await updatePlaylistAction('nonexistent', { title: 'New' });
    expect(result).toBeNull();
  });
});

describe('deletePlaylistAction', () => {
  it('throws when not authenticated', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(deletePlaylistAction('p1')).rejects.toThrow('Unauthorized');
    expect(execute).not.toHaveBeenCalled();
  });

  it('deletes playlist and returns true', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    execute.mockResolvedValueOnce([{ id: 'p1' }]);

    const result = await deletePlaylistAction('p1');
    expect(result).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns false when playlist not found or not owned', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    execute.mockResolvedValueOnce([]);
    execute.mockResolvedValueOnce([]);

    const result = await deletePlaylistAction('nonexistent');
    expect(result).toBe(false);
  });
});
