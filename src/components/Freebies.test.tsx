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
  getHighResImage: vi.fn((thumb: string) => thumb),
}));

import Freebies from './Freebies';

const mockDeal = {
  dealID: 'deal_001',
  storeID: '1',
  gameID: '999',
  title: 'Free Game',
  salePrice: '0',
  normalPrice: '19.99',
  isOnSale: '1',
  savings: '100',
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
  internalName: 'FREEGAME',
};

describe('Freebies', () => {
  it('returns null for empty deals', () => {
    const { container } = render(<Freebies deals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for undefined deals', () => {
    const { container } = render(<Freebies deals={undefined as never} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "FREE GAMES" title', () => {
    render(<Freebies deals={[mockDeal]} />);
    expect(screen.getByText(/FREE GAMES/)).toBeInTheDocument();
  });

  it('renders "Claim Now" badge', () => {
    render(<Freebies deals={[mockDeal]} />);
    expect(screen.getByText('Claim Now')).toBeInTheDocument();
  });

  it('limits to 6 items', () => {
    const deals = Array.from({ length: 10 }, (_, i) => ({
      ...mockDeal,
      dealID: `deal_${i}`,
      gameID: `${i}`,
      title: `Game ${i}`,
    }));
    render(<Freebies deals={deals} />);
    expect(screen.getAllByText('FREE')).toHaveLength(6);
  });

  it('each card links to /game/{gameID}', () => {
    render(<Freebies deals={[mockDeal]} />);
    const links = screen.getAllByRole('link');
    const gameLink = links.find((l) => l.getAttribute('href') === '/game/999');
    expect(gameLink).toBeDefined();
  });

  it('shows "FREE" badge on each card', () => {
    render(<Freebies deals={[mockDeal]} />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });
});
