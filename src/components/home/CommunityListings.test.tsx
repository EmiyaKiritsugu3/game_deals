/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/actions/playlists', () => ({
  getUserPlaylistsAction: vi.fn(),
}));

import { getUserPlaylistsAction } from '@/actions/playlists';
import CommunityListings from './CommunityListings';

const mockPlaylists = [
  {
    id: 'pl-1',
    userId: 'u-1',
    title: 'Best RPGs',
    slug: 'best-rpgs',
    description: 'Top role-playing games under $10',
    isPublic: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'pl-2',
    userId: 'u-2',
    title: 'Hidden Gems',
    slug: 'hidden-gems',
    description: null,
    isPublic: false,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
];

describe('CommunityListings', () => {
  it('renders section heading', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    expect(screen.getByText('Community Lists')).toBeInTheDocument();
  });

  it('renders playlist cards', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    expect(screen.getByText('Best RPGs')).toBeInTheDocument();
    expect(screen.getByText('Hidden Gems')).toBeInTheDocument();
  });

  it('renders description when present', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    expect(screen.getByText('Top role-playing games under $10')).toBeInTheDocument();
  });

  it('renders visibility status', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('links to playlist detail page', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    const link = screen.getByText('Best RPGs').closest('a');
    expect(link).toHaveAttribute('href', '/playlists/best-rpgs');
  });

  it('renders All Lists link', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(await CommunityListings());
    const link = screen.getByText('All Lists →');
    expect(link).toHaveAttribute('href', '/playlists');
  });

  it('returns null when no playlists', async () => {
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce([]);
    const result = await CommunityListings();
    expect(result).toBeNull();
  });

  it('handles error from getUserPlaylistsAction gracefully', async () => {
    vi.mocked(getUserPlaylistsAction).mockRejectedValueOnce(new Error('DB error'));
    await expect(CommunityListings()).rejects.toThrow('DB error');
  });
});
