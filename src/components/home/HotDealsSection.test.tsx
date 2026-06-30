/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}));
vi.mock('@/store/density', () => ({ useDensity: vi.fn(() => 'comfortable') }));

import HotDealsSection from './HotDealsSection';

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
  dealRating: '9.5',
  thumb: '',
  metacriticLink: '',
};

describe('HotDealsSection', () => {
  it('renders section heading', async () => {
    render(await HotDealsSection({ deals: [mockDeal] }));
    expect(screen.getByText('Hottest Deals')).toBeInTheDocument();
  });
  it('renders game titles sorted by dealRating', async () => {
    const { container } = render(
      await HotDealsSection({
        deals: [
          { ...mockDeal, dealRating: '5', title: 'Low', dealID: 'a' },
          { ...mockDeal, dealRating: '9.5', title: 'High', dealID: 'b' },
        ],
      })
    );
    expect(container.textContent).toContain('High');
    expect(container.textContent).toContain('Low');
  });
  it('respects limit prop', async () => {
    const deals = Array.from({ length: 20 }, (_, i) => ({
      ...mockDeal,
      dealID: `d_${i}`,
      title: `G${i}`,
      dealRating: String(20 - i),
    }));
    const { container } = render(await HotDealsSection({ deals, limit: 5 }));
    expect(container.textContent).toContain('G4');
    expect(container.textContent).not.toContain('G5');
  });
  it('renders nothing with empty deals', async () => {
    const { container } = render(await HotDealsSection({ deals: [] }));
    expect(container.innerHTML).toBe('');
  });
});
