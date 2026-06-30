/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}));
vi.mock('@/store/density', () => ({ useDensity: vi.fn(() => 'comfortable') }));

const mockGetDeals = vi.fn();
vi.mock('@/services/api', () => ({ getDeals: (...a: unknown[]) => mockGetDeals(...a) }));

import EndingSoon from './EndingSoon';

const mkDeal = (id: string, title: string) => ({
  dealID: id,
  storeID: '1',
  gameID: id,
  title,
  salePrice: '9.99',
  normalPrice: '19.99',
  savings: '50',
  thumb: '',
  lastChange: 1,
  steamRatingPercent: '90',
});

describe('EndingSoon', () => {
  it('returns null for empty deals', async () => {
    mockGetDeals.mockResolvedValue([]);
    const { container } = render(await EndingSoon());
    expect(container.firstChild).toBeNull();
  });
  it('renders section title', async () => {
    mockGetDeals.mockResolvedValue([mkDeal('1', 'Game 1')]);
    render(await EndingSoon());
    expect(screen.getByText(/⏰ Ending Soon/)).toBeInTheDocument();
  });
  it('renders deal titles', async () => {
    mockGetDeals.mockResolvedValue([mkDeal('1', 'Game 1'), mkDeal('2', 'Game 2')]);
    render(await EndingSoon());
    expect(screen.getByText('Game 1')).toBeInTheDocument();
    expect(screen.getByText('Game 2')).toBeInTheDocument();
  });
  it('calls getDeals with correct params', async () => {
    mockGetDeals.mockResolvedValue([]);
    render(await EndingSoon());
    expect(mockGetDeals).toHaveBeenCalledWith({ sortBy: 'Recent', pageSize: '8', onSale: '1' });
  });
});
