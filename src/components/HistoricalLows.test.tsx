/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}));
vi.mock('@/store/density', () => ({
  useDensity: vi.fn(() => 'comfortable'),
}));

const getDealsMock = vi.fn();
vi.mock('@/services/api', () => ({
  getDeals: (...args: unknown[]) => getDealsMock(...args),
}));

import HistoricalLows from './HistoricalLows';

function makeDeal(id: string, salePrice = '14.99', savings = '50') {
  return {
    gameID: id,
    dealID: `${id}-deal`,
    title: `Game ${id}`,
    salePrice,
    normalPrice: '29.99',
    savings,
    metacriticScore: '80',
    steamRatingText: 'Very Positive',
    thumb: 'https://example.com/thumb.jpg',
    storeID: '1',
    steamRatingPercent: '90',
    steamRatingCount: '500',
    lastChange: 1600000000,
    releaseDate: 1600000000,
    dealRating: '9.0',
    isOnSale: '1',
    steamAppID: '12345',
    metacriticLink: '/game/pc/test',
    internalName: 'TEST',
  };
}

describe('HistoricalLows', () => {
  it('renders section with deals', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99'), makeDeal('2', '14.99')])
      .mockResolvedValueOnce([]);

    render(await HistoricalLows());
    expect(screen.getByText(/Historical Lows/i)).toBeInTheDocument();
    expect(screen.getByText('Game 1')).toBeInTheDocument();
    expect(screen.getByText('Game 2')).toBeInTheDocument();
  });

  it('returns null when no deals', async () => {
    getDealsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const result = await HistoricalLows();
    expect(result).toBeNull();
  });

  it('combines bestDeals and popular pools', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99')])
      .mockResolvedValueOnce([makeDeal('2', '14.99')]);

    render(await HistoricalLows());
    expect(screen.getByText('Game 1')).toBeInTheDocument();
    expect(screen.getByText('Game 2')).toBeInTheDocument();
  });
});
