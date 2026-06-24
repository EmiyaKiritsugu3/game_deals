/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HistoricalLows from './HistoricalLows';

// Mock DealRow to avoid full rendering
vi.mock('./DealRow', () => ({
  default: ({ deal }: { deal: { dealID: string; title: string } }) => (
    <div data-testid={`deal-${deal.dealID}`}>{deal.title}</div>
  ),
}));

// Mock DealsBadge to avoid full rendering
vi.mock('./DealsBadge', () => ({
  default: ({ type }: { type: string }) => <span data-testid={`badge-${type}`}>{type}</span>,
}));

// Mock CSS module
vi.mock('./HistoricalLows.module.css', () => ({
  default: {
    listSection: 'ls',
    sectionHeader: 'sh',
    sectionHeaderRow: 'shr',
    headerHL: 'hhl',
    listCol: 'lc',
  },
}));

const getDealsMock = vi.fn();
const getGamesBatchMock = vi.fn();
vi.mock('@/services/api', () => ({
  getDeals: (...args: unknown[]) => getDealsMock(...args),
  getGamesBatch: (...args: unknown[]) => getGamesBatchMock(...args),
}));

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
  };
}

describe('HistoricalLows', () => {
  it('renders verified HL deals when API returns valid data', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99'), makeDeal('2', '14.99')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGamesBatchMock.mockImplementation((ids: string[]) => {
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        result[id] = {
          cheapestPriceEver: {
            price: id === '1' ? '9.99' : '12.00', // id=1 passes (within 1%), id=2 fails
            date: '2024-01-01',
          },
        };
      }
      return Promise.resolve(result);
    });

    const { container } = render(await HistoricalLows());

    expect(screen.getByText('Game 1')).toBeInTheDocument();
    expect(screen.queryByText('Game 2')).not.toBeInTheDocument();
    expect(container.querySelector('h2')?.textContent).toMatch(/Historical Lows/i);
  });

  it('deduplicates by gameID across the 3 API pools', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99'), makeDeal('2', '9.99')]) // broadPool
      .mockResolvedValueOnce([makeDeal('1', '8.99')]) // bestDeals (dup gameID=1)
      .mockResolvedValueOnce([makeDeal('3', '10.00')]); // popular

    getGamesBatchMock.mockImplementation((ids: string[]) => {
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        result[id] = { cheapestPriceEver: { price: '9.99', date: '2024-01-01' } };
      }
      return Promise.resolve(result);
    });

    const { container } = render(await HistoricalLows());

    // only 3 unique deals rendered despite 4 total API results
    const deals = container.querySelectorAll('[data-testid^="deal-"]');
    expect(deals.length).toBe(3);
  });

  it('returns null when no deals pass HL verification', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '20.00'), makeDeal('2', '25.00')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGamesBatchMock.mockImplementation((ids: string[]) => {
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        result[id] = { cheapestPriceEver: { price: '5.00', date: '2024-01-01' } }; // current > 1% of HL
      }
      return Promise.resolve(result);
    });

    const result = await HistoricalLows();
    expect(result).toBeNull();
  });

  it('handles gameInfo with no cheapestPriceEver gracefully', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGamesBatchMock.mockResolvedValue({
      '1': null, // Mocking that gameInfo is undefined or lacks cheapestPriceEver
    });

    const result = await HistoricalLows();
    expect(result).toBeNull();
  });

  it('handles rejected promises from getGamesBatch (API failure)', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99'), makeDeal('2', '9.99')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGamesBatchMock.mockRejectedValueOnce(new Error('API error'));

    // Component will crash or throw. Test depends on boundary, or we can just mock empty object.
    // Our refactored component does not catch the error natively within itself since the await getGamesBatch
    // throws. We'll expect it to throw.
    await expect(HistoricalLows()).rejects.toThrow('API error');
  });
});
