/**
 * @vitest-environment jsdom
 *
 * Integration test: verify all 4 home sections render together.
 * Home page does not yet wire these components — this test validates
 * they compose without interference.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CommunityListings from './CommunityListings';
import DiscoveryGrid from './DiscoveryGrid';
import HomeHero from './HomeHero';
import HotDealsSection from './HotDealsSection';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      fill: _fill,
      sizes: _sizes,
      priority: _priority,
      className: _className,
      ...rest
    } = props;
    return <div data-src={String(src)} data-alt={String(alt)} {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/GameCard', () => ({
  default: ({ deal }: { deal: { title: string; dealID: string } }) => (
    <div data-testid="game-card">{deal.title}</div>
  ),
}));

const { mockCollections } = vi.hoisted(() => ({
  mockCollections: vi.fn<() => Array<{ slug: string; title: string; description: string; emoji: string; gameIDs: string[] }>>(),
}));

vi.mock('@/data/collections', () => ({
  get COLLECTIONS() {
    return mockCollections();
  },
}));

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb),
  getStores: vi.fn().mockResolvedValue({ '1': 'Steam' }),
  formatTimeAgo: vi.fn(() => '1h ago'),
}));

vi.mock('@/actions/playlists', () => ({
  getUserPlaylistsAction: vi.fn(),
}));

import { getUserPlaylistsAction } from '@/actions/playlists';

const mockDeal = {
  internalName: 'TESTGAME',
  title: 'Test Game',
  dealID: 'deal_001',
  storeID: '1',
  gameID: '999',
  salePrice: '9.99',
  normalPrice: '19.99',
  isOnSale: '1',
  savings: '50.00',
  metacriticScore: '80',
  steamRatingText: 'Very Positive',
  steamRatingPercent: '90',
  steamRatingCount: '1000',
  steamAppID: '12345',
  releaseDate: 1600000000,
  lastChange: 1600000000,
  dealRating: '8.5',
  thumb: 'https://example.com/thumb.jpg',
  metacriticLink: '/game/pc/test-game',
};

const mockPlaylists = [
  {
    id: 'pl-1',
    userId: 'u-1',
    title: 'Best RPGs',
    slug: 'best-rpgs',
    description: 'Top role-playing games',
    isPublic: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

describe('HomeSections integration', () => {
  it('renders all 4 sections together without conflict', async () => {
    mockCollections.mockReturnValue([
      { slug: 'test', title: 'Test Col', description: 'desc', emoji: '🎮', gameIDs: ['1'] },
    ]);
    vi.mocked(getUserPlaylistsAction).mockResolvedValueOnce(mockPlaylists);

    render(
      <div>
        <HomeHero deal={mockDeal} />
        {await HotDealsSection({ deals: [mockDeal] })}
        <DiscoveryGrid />
        {await CommunityListings()}
      </div>
    );

    expect(screen.getByText('FEATURED DEAL')).toBeInTheDocument();
    expect(screen.getAllByText('Test Game')).toHaveLength(2); // heading + GameCard
    expect(screen.getByText('Hottest Deals')).toBeInTheDocument();
    expect(screen.getByText('Discover Games')).toBeInTheDocument();
    expect(screen.getByText('Community Lists')).toBeInTheDocument();
    expect(screen.getByText('Test Col')).toBeInTheDocument();
    expect(screen.getByText('Best RPGs')).toBeInTheDocument();
  });
});
