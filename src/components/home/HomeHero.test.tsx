/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomeHero from './HomeHero';

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

vi.mock('@/services/api', () => ({
  getHighResImage: vi.fn((thumb: string) => thumb.replace('capsule', 'header')),
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
  dealRating: '8.5',
  thumb: 'https://example.com/capsule_sm_120.jpg',
  metacriticLink: '/game/pc/test-game',
};

describe('HomeHero', () => {
  it('renders featured deal badge', () => {
    render(<HomeHero deal={mockDeal} />);
    expect(screen.getByText('FEATURED DEAL')).toBeInTheDocument();
  });

  it('renders game title', () => {
    render(<HomeHero deal={mockDeal} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('renders sale price', () => {
    render(<HomeHero deal={mockDeal} />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('renders normal price strikethrough', () => {
    render(<HomeHero deal={mockDeal} />);
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('renders savings badge', () => {
    render(<HomeHero deal={mockDeal} />);
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('does not render savings badge when savings = 0', () => {
    render(<HomeHero deal={{ ...mockDeal, savings: '0' }} />);
    expect(screen.queryByText(/-%/)).not.toBeInTheDocument();
  });

  it('does not render strikethrough price when savings = 0', () => {
    render(<HomeHero deal={{ ...mockDeal, savings: '0' }} />);
    expect(screen.queryByText('$19.99')).not.toBeInTheDocument();
  });

  it('renders View Deal link to game page', () => {
    render(<HomeHero deal={mockDeal} />);
    const link = screen.getByText('View Deal');
    expect(link).toHaveAttribute('href', '/game/999');
  });

  it('renders Buy Now link to CheapShark', () => {
    render(<HomeHero deal={mockDeal} />);
    const link = screen.getByText('Buy Now');
    expect(link).toHaveAttribute('href', 'https://www.cheapshark.com/redirect?dealID=deal_001');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
