/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HotDealsSection from './HotDealsSection';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/GameCard', () => ({
  default: ({ deal }: { deal: { title: string; dealID: string } }) => (
    <div data-testid="game-card" data-deal-id={deal.dealID}>
      {deal.title}
    </div>
  ),
}));

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb),
  getStores: vi.fn().mockResolvedValue({ '1': 'Steam' }),
  formatTimeAgo: vi.fn(() => '1h ago'),
}));

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
  dealRating: '9.5',
  thumb: 'https://example.com/thumb.jpg',
  metacriticLink: '/game/pc/test-game',
};

describe('HotDealsSection', () => {
  it('renders section heading', async () => {
    render(await HotDealsSection({ deals: [mockDeal] }));
    expect(screen.getByText('Hottest Deals')).toBeInTheDocument();
  });

  it('renders game cards sorted by dealRating descending', async () => {
    const dealA = { ...mockDeal, dealRating: '5.0', title: 'Low', dealID: 'a' };
    const dealB = { ...mockDeal, dealRating: '9.5', title: 'High', dealID: 'b' };
    render(await HotDealsSection({ deals: [dealA, dealB] }));
    const cards = screen.getAllByTestId('game-card');
    expect(cards[0]).toHaveTextContent('High');
    expect(cards[1]).toHaveTextContent('Low');
  });

  it('respects limit prop', async () => {
    const deals = Array.from({ length: 20 }, (_, i) => ({
      ...mockDeal,
      dealID: `deal_${i}`,
      title: `Game ${i}`,
      dealRating: `${i}`,
    }));
    render(await HotDealsSection({ deals, limit: 5 }));
    expect(screen.getAllByTestId('game-card')).toHaveLength(5);
  });

  it('renders nothing with empty deals', async () => {
    const { container } = render(await HotDealsSection({ deals: [] }));
    expect(container.innerHTML).toBe('');
  });

  it('renders See All link', async () => {
    render(await HotDealsSection({ deals: [mockDeal] }));
    const link = screen.getByText('See All →');
    expect(link).toHaveAttribute('href', '/search?sort=dealRating');
  });
});
