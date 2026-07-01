/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CommunityListings from './CommunityListings';
import DiscoveryGrid from './DiscoveryGrid';
import HomeHero from './HomeHero';

vi.mock('next/image', () => ({
  default: (p: Record<string, unknown>) => {
    const { src, alt, fill: _f, sizes: _s, priority: _p, className: _c, ...rest } = p;
    return <div data-src={String(src)} data-alt={String(alt)} {...rest} />;
  },
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...p }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...p}>
      {children}
    </a>
  ),
}));

const { mockCollections } = vi.hoisted(() => ({ mockCollections: vi.fn() }));
vi.mock('@/data/collections', () => ({
  get COLLECTIONS() {
    return mockCollections();
  },
}));
vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((t: string) => t),
  formatTimeAgo: vi.fn(() => '1h ago'),
}));
vi.mock('@/actions/playlists', () => ({ getUserPlaylistsAction: vi.fn() }));

import { getUserPlaylistsAction } from '@/actions/playlists';

const mockDeal = {
  internalName: '',
  title: 'Test Game',
  dealID: '1',
  storeID: '1',
  gameID: '100',
  salePrice: '9.99',
  normalPrice: '19.99',
  isOnSale: '1',
  savings: '50',
  metacriticScore: '80',
  steamRatingText: '',
  steamRatingPercent: '0',
  steamRatingCount: '0',
  steamAppID: '',
  releaseDate: 0,
  lastChange: 0,
  dealRating: '8.5',
  thumb: '',
  metacriticLink: '',
};
const mockPlaylists = [
  {
    id: 'pl-1',
    userId: 'u-1',
    title: 'Best RPGs',
    slug: 'best-rpgs',
    description: 'Top RPGs',
    isPublic: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

describe('HomeSections integration', () => {
  it('renders all 3 sections together', async () => {
    mockCollections.mockReturnValue([
      {
        slug: 'test',
        title: 'Test Col',
        description: 'desc',
        emoji: '🎮',
        gameIDs: ['1'],
      },
    ]);
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);
    render(
      <div>
        <HomeHero deal={mockDeal} />
        <DiscoveryGrid />
        {await CommunityListings()}
      </div>
    );
    expect(screen.getByText('FEATURED DEAL')).toBeInTheDocument();
    expect(screen.getByText('Discover Games')).toBeInTheDocument();
    expect(screen.getByText('Community Lists')).toBeInTheDocument();
    expect(screen.getByText('Test Col')).toBeInTheDocument();
    expect(screen.getByText('Best RPGs')).toBeInTheDocument();
  });
});
