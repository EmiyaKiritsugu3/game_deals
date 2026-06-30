/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (p: Record<string, unknown>) => {
    const { src, alt, fill: _f, sizes: _s, className: _c, ...rest } = p;
    return <div data-src={String(src)} data-alt={String(alt)} {...rest} />;
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}));
vi.mock('@/store/density', () => ({ useDensity: vi.fn(() => 'comfortable') }));

import Freebies from './Freebies';

const mockDeal = {
  dealID: '1',
  storeID: '1',
  gameID: '100',
  title: 'Free Game',
  salePrice: '0',
  normalPrice: '19.99',
  isOnSale: '1',
  savings: '100',
  metacriticScore: '80',
  steamRatingText: '',
  steamRatingPercent: '0',
  steamRatingCount: '0',
  steamAppID: '',
  releaseDate: 0,
  lastChange: 0,
  dealRating: '0',
  thumb: '',
  metacriticLink: '',
  internalName: '',
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
  it('renders FREE GAMES title', () => {
    render(<Freebies deals={[mockDeal]} />);
    expect(screen.getByText(/FREE GAMES/)).toBeInTheDocument();
  });
  it('limits to 6 items', () => {
    const deals = Array.from({ length: 10 }, (_, i) => ({
      ...mockDeal,
      dealID: `d_${i}`,
      gameID: `g_${i}`,
      title: `G${i}`,
    }));
    const { container } = render(<Freebies deals={deals} />);
    expect(container.textContent).toContain('G0');
    expect(container.textContent).toContain('G5');
    expect(container.textContent).not.toContain('G6');
  });
  it('renders game title', () => {
    render(<Freebies deals={[mockDeal]} />);
    expect(screen.getByText('Free Game')).toBeInTheDocument();
  });
});
