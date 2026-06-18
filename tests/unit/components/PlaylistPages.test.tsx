/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const store: {
    isLoggedIn: boolean;
    user: { id: string; name: string; email: string; avatar: string } | null;
    playlistsData: Array<{
      id: string;
      title: string;
      description: string | null;
      isPublic: boolean;
      _gameCount: number;
    }> | undefined;
    playlistsLoading: boolean;
    detailData: {
      id: string;
      title: string;
      description: string | null;
      isPublic: boolean;
      userId: string;
      games: Array<{ gameId: string; cheapsharkId: string; title: string; thumbUrl: string | null }>;
    } | undefined;
    detailLoading: boolean;
    addMutation: { isPending: boolean; mutate: ReturnType<typeof vi.fn> };
    createMutation: { isPending: boolean; mutate: ReturnType<typeof vi.fn> };
  } = {
    isLoggedIn: true,
    user: { id: 'user-1', name: 'Test', email: 'test@test.com', avatar: '' },
    playlistsData: undefined,
    playlistsLoading: false,
    detailData: undefined,
    detailLoading: false,
    addMutation: { isPending: false, mutate: vi.fn() },
    createMutation: { isPending: false, mutate: vi.fn() },
  };
  return store;
});

vi.mock('@/hooks/usePlaylists', () => ({
  usePlaylists: () => ({
    data: mocks.playlistsData,
    isLoading: mocks.playlistsLoading,
  }),
  usePlaylistDetail: (id: string) => ({
    data: mocks.detailData,
    isLoading: mocks.detailLoading,
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({
    isLoggedIn: mocks.isLoggedIn,
    user: mocks.user,
  }),
}));

vi.mock('@/hooks/usePlaylistMutations', () => ({
  usePlaylistMutations: () => ({
    addMutation: mocks.addMutation,
    createMutation: mocks.createMutation,
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => React.createElement('a', { href, className }, children),
}));

vi.mock('@/app/playlists/page.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css' }),
}));
vi.mock('@/app/playlists/[id]/page.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css' }),
}));

describe('PlaylistsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLoggedIn = true;
    mocks.playlistsData = undefined;
    mocks.playlistsLoading = false;
  });

  it('renders sign in prompt when not logged in', async () => {
    mocks.isLoggedIn = false;
    const { default: PlaylistsPage } = await import('@/app/playlists/page');
    render(React.createElement(PlaylistsPage));
    expect(screen.getByRole('heading', { name: /sign in to see your playlists/i })).toBeInTheDocument();
  });

  it('renders loading state', async () => {
    mocks.playlistsLoading = true;
    const { default: PlaylistsPage } = await import('@/app/playlists/page');
    render(React.createElement(PlaylistsPage));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders empty state when no playlists', async () => {
    mocks.playlistsData = [];
    const { default: PlaylistsPage } = await import('@/app/playlists/page');
    render(React.createElement(PlaylistsPage));
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
  });

  it('renders playlist cards', async () => {
    mocks.playlistsData = [
      { id: 'p1', title: 'My List', description: 'A list', isPublic: true, _gameCount: 5 },
      { id: 'p2', title: 'Private', description: null, isPublic: false, _gameCount: 0 },
    ];
    const { default: PlaylistsPage } = await import('@/app/playlists/page');
    render(React.createElement(PlaylistsPage));

    expect(screen.getByText('My List')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText(/Public/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Playlist/i)).toBeInTheDocument();
  });
});

describe('PlaylistDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLoggedIn = true;
    mocks.detailData = undefined;
    mocks.detailLoading = false;
  });

  it('renders sign in prompt when not logged in', async () => {
    mocks.isLoggedIn = false;
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));
    expect(screen.getByRole('heading', { name: /sign in to see this playlist/i })).toBeInTheDocument();
  });

  it('renders loading state', async () => {
    mocks.detailLoading = true;
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders playlist title and description', async () => {
    mocks.detailData = {
      id: 'p1',
      title: 'My Cool List',
      description: 'Best games ever',
      isPublic: true,
      userId: 'user-1',
      games: [],
    };
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));

    expect(screen.getByText('My Cool List')).toBeInTheDocument();
    expect(screen.getByText('Best games ever')).toBeInTheDocument();
  });

  it('renders empty games state', async () => {
    mocks.detailData = {
      id: 'p1',
      title: 'Empty',
      description: null,
      isPublic: false,
      userId: 'user-1',
      games: [],
    };
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));

    expect(screen.getByText(/No games in this playlist/i)).toBeInTheDocument();
  });

  it('renders game cards in playlist', async () => {
    mocks.detailData = {
      id: 'p1',
      title: 'Favorites',
      description: null,
      isPublic: true,
      userId: 'user-2',
      games: [
        { gameId: 'g1', cheapsharkId: '123', title: 'Game A', thumbUrl: 'a.jpg' },
        { gameId: 'g2', cheapsharkId: '456', title: 'Game B', thumbUrl: null },
      ],
    };
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));

    expect(screen.getByText('Game A')).toBeInTheDocument();
    expect(screen.getByText('Game B')).toBeInTheDocument();
  });

  it('shows edit/delete buttons for owner', async () => {
    mocks.detailData = {
      id: 'p1',
      title: 'My List',
      description: null,
      isPublic: true,
      userId: 'user-1',
      games: [],
    };
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));

    expect(screen.getByText(/Delete/i)).toBeInTheDocument();
  });

  it('does not show edit/delete buttons for non-owner', async () => {
    mocks.detailData = {
      id: 'p1',
      title: 'Others List',
      description: null,
      isPublic: true,
      userId: 'user-999',
      games: [],
    };
    const { default: PlaylistDetailPage } = await import('@/app/playlists/[id]/page');
    render(React.createElement(PlaylistDetailPage, { params: { id: 'p1' } }));

    expect(screen.queryByText(/Delete/i)).not.toBeInTheDocument();
  });
});
