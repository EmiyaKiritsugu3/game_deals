/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, fill: _fill, sizes: _sizes, className: _className, ...rest } = props;
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

vi.mock('../services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb.replace('capsule', 'header')),
  getStoreLogo: vi.fn((id: string) => `https://store-${id}.example.com/favicon.ico`),
  getStores: vi.fn().mockResolvedValue({
    '1': { storeID: '1', storeName: 'Steam', isActive: 1 },
    '2': { storeID: '2', storeName: 'GOG', isActive: 1 },
  }),
}));

vi.mock('./HeartButton', () => ({
  default: ({ gameID }: { gameID: string }) => (
    <button type="button" data-testid="heart-button" data-game-id={gameID}>
      Heart
    </button>
  ),
}));

vi.mock('./PriceAlertBadge', () => ({
  default: ({ gameID }: { gameID: string }) => (
    <div data-testid="price-alert-badge" data-game-id={gameID}>
      Alert
    </div>
  ),
}));

vi.mock('./AddToListButton', () => ({
  default: ({ gameId }: { gameId: string }) => (
    <button type="button" data-testid="add-to-list" data-game-id={gameId}>
      Add
    </button>
  ),
}));

vi.mock('./DealsBadge', () => ({
  default: ({ type, compact }: { type: string; compact?: boolean }) => (
    <span data-testid={`badge-${type}`} data-compact={compact}>
      {type}
    </span>
  ),
}));

import GameCard from './GameCard';

const mockDeal = {
  dealID: 'deal_001',
  storeID: '1',
  gameID: '999',
  title: 'Test Game',
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
  internalName: 'TESTGAME',
};

describe('GameCard', () => {
  it('renders game title', async () => {
    render(await GameCard({ deal: mockDeal }));
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('renders store name', async () => {
    render(await GameCard({ deal: mockDeal }));
    expect(screen.getByText('Steam')).toBeInTheDocument();
  });

  it('shows savings badge for discounted games', async () => {
    render(await GameCard({ deal: mockDeal }));
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('does not show savings badge when savings = 0', async () => {
    render(await GameCard({ deal: { ...mockDeal, savings: '0' } }));
    expect(screen.queryByText(/-%/)).not.toBeInTheDocument();
  });

  it('shows EPIC badge for savings >= 85%', async () => {
    render(await GameCard({ deal: { ...mockDeal, savings: '90.00' } }));
    expect(screen.getByTestId('badge-EPIC')).toBeInTheDocument();
  });

  it('shows HL badge for savings >= 90%', async () => {
    render(await GameCard({ deal: { ...mockDeal, savings: '95.00' } }));
    expect(screen.getByTestId('badge-HL')).toBeInTheDocument();
  });

  it('shows rating when steamRatingPercent set', async () => {
    render(await GameCard({ deal: mockDeal }));
    expect(screen.getByText(/90%/)).toBeInTheDocument();
  });

  it('does not show rating when steamRatingPercent is "0"', async () => {
    render(await GameCard({ deal: { ...mockDeal, steamRatingPercent: '0', savings: '0' } }));
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('renders rating stars when steamRatingPercent is provided', async () => {
    const deal = { ...mockDeal, steamRatingPercent: '80' };
    const { container } = render(await GameCard({ deal }));
    expect(container.textContent).toContain('★ 80%');
  });

  it('does not render rating when steamRatingPercent is 0', async () => {
    const deal = { ...mockDeal, steamRatingPercent: '0' };
    const { container } = render(await GameCard({ deal }));
    expect(container.textContent).toContain(deal.salePrice);
  });

  it('links to /game/{gameID}', async () => {
    render(await GameCard({ deal: mockDeal }));
    const links = screen.getAllByRole('link');
    const gameLink = links.find((l) => l.getAttribute('href') === '/game/999');
    expect(gameLink).toBeDefined();
  });
});
