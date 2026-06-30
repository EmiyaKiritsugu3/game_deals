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

import FlashSales from './FlashSales';

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

describe('FlashSales', () => {
  it('renders nothing for empty deals', () => {
    const { container } = render(<FlashSales deals={[]} />);
    expect(container.innerHTML).toBe('');
  });
  it('renders nothing for undefined deals', () => {
    const { container } = render(<FlashSales deals={undefined as never} />);
    expect(container.innerHTML).toBe('');
  });
  it('renders section title', () => {
    render(<FlashSales deals={[mockDeal]} />);
    expect(screen.getByText('⚡ Flash Deals')).toBeInTheDocument();
  });
  it('renders discount badge', () => {
    render(<FlashSales deals={[mockDeal]} />);
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });
  it('limits to 8 deals', () => {
    const deals = Array.from({ length: 12 }, (_, i) => ({
      ...mockDeal,
      dealID: `d_${i}`,
      gameID: `g_${i}`,
      title: `G${i}`,
    }));
    const { container } = render(<FlashSales deals={deals} />);
    expect(container.textContent).toContain('G0');
    expect(container.textContent).toContain('G7');
    expect(container.textContent).not.toContain('G8');
  });
  it('renders game title', () => {
    render(<FlashSales deals={[mockDeal]} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });
});
