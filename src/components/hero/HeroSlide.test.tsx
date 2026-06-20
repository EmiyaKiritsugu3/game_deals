/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Gamepad2: () => <div data-testid="gamepad-icon" />,
  Monitor: () => <div data-testid="monitor-icon" />,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      fill: _fill,
      sizes: _sizes,
      className: _className,
      priority: _priority,
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

vi.mock('../../services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb),
  getStoreLogo: vi.fn(() => 'https://example.com/steam.png'),
}));

import { HeroSlide } from './HeroSlide';

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

describe('HeroSlide', () => {
  it('renders deal title', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('shows savings badge when savings > 0', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    expect(screen.getByText('Save 50%')).toBeInTheDocument();
  });

  it('does not show savings badge when savings = 0', () => {
    render(<HeroSlide deal={{ ...mockDeal, savings: '0' }} isActive={true} index={0} />);
    expect(screen.queryByText(/Save/)).not.toBeInTheDocument();
  });

  it('shows FEATURED DEAL badge', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    expect(screen.getByText('FEATURED DEAL')).toBeInTheDocument();
  });

  it('shows CTA link to /game/{gameID}', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    const cta = screen.getByText('Get Deal Now');
    expect(cta).toHaveAttribute('href', '/game/999');
  });

  it('shows normal price when savings > 0', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('shows sale price', () => {
    render(<HeroSlide deal={mockDeal} isActive={true} index={0} />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });
});
