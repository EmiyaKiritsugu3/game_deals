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

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb.replace('capsule', 'header')),
  getStoreLogo: vi.fn((storeID: string) =>
    storeID === '1' ? 'https://example.com/steam.png' : null
  ),
  getStores: vi.fn().mockResolvedValue({ '1': 'Steam', '2': 'GOG' }),
  formatTimeAgo: vi.fn(() => '2 hours ago'),
}));

vi.mock('./DealsBadge', () => ({
  default: ({ type, value }: { type: string; value?: number }) => (
    <span data-testid={`badge-${type}`}>{value ? `${type} ${value}` : type}</span>
  ),
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

import DealRow from './DealRow';

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

describe('DealRow', () => {
  it('renders deal title', async () => {
    render(await DealRow({ deal: mockDeal }));
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('renders store name when no logo', async () => {
    const { getStoreLogo } = await import('@/services/api');
    vi.mocked(getStoreLogo).mockReturnValueOnce(null);
    render(await DealRow({ deal: { ...mockDeal, storeID: '99' } }));
    expect(screen.getByText(/Store 99/)).toBeInTheDocument();
  });

  it('renders store logo img when logo exists', async () => {
    render(await DealRow({ deal: mockDeal }));
    const img = screen.getByRole('img', { name: 'Steam' });
    expect(img).toBeInTheDocument();
  });

  it('shows discount badge for deals with savings > 0', async () => {
    render(await DealRow({ deal: mockDeal }));
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('shows "FREE" for free games', async () => {
    render(await DealRow({ deal: { ...mockDeal, salePrice: '0' } }));
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows "HL" badge for savings > 85%', async () => {
    render(await DealRow({ deal: { ...mockDeal, savings: '90.00' } }));
    expect(screen.getByTestId('badge-HL')).toBeInTheDocument();
  });

  it('shows "EPIC" badge for savings >= 75%', async () => {
    render(await DealRow({ deal: { ...mockDeal, savings: '80.00' } }));
    expect(screen.getByTestId('badge-EPIC')).toBeInTheDocument();
  });

  it('renders rating badge when steamRatingPercent is set', async () => {
    render(await DealRow({ deal: mockDeal }));
    expect(screen.getByTestId('badge-RATING')).toBeInTheDocument();
  });

  it('does not render rating when steamRatingPercent is "0"', async () => {
    render(await DealRow({ deal: { ...mockDeal, steamRatingPercent: '0' } }));
    expect(screen.queryByTestId('badge-RATING')).not.toBeInTheDocument();
  });

  it('links to /game/{gameID}', async () => {
    render(await DealRow({ deal: mockDeal }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/999');
  });
});
