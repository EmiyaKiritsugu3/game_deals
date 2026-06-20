/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getDealsWithParams, SearchResults } from './SearchResults';

vi.mock('@/components/GameCard', () => ({
  default: ({ deal }: { deal: { dealID: string } }) => (
    <div data-testid="game-card" data-dealid={deal.dealID} />
  ),
}));

vi.mock('@/services/api', () => ({
  getDeals: vi.fn(),
}));

const mockDeals = [
  {
    dealID: '1',
    title: 'Game One',
    salePrice: '9.99',
    normalPrice: '19.99',
    thumb: 'https://example.com/1.jpg',
    storeID: '1',
    gameID: '100',
    isOnSale: '1',
    savings: '50',
    internalName: 'GAME1',
    releaseDate: 0,
    lastChange: 0,
    dealRating: '8',
    metacriticScore: '80',
    steamRatingText: 'Positive',
    steamRatingPercent: '90',
    steamRatingCount: '100',
    steamAppID: '1000',
    metacriticLink: '',
  },
  {
    dealID: '2',
    title: 'Game Two',
    salePrice: '4.99',
    normalPrice: '14.99',
    thumb: 'https://example.com/2.jpg',
    storeID: '2',
    gameID: '200',
    isOnSale: '1',
    savings: '66',
    internalName: 'GAME2',
    releaseDate: 0,
    lastChange: 0,
    dealRating: '9',
    metacriticScore: '90',
    steamRatingText: 'Very Positive',
    steamRatingPercent: '95',
    steamRatingCount: '200',
    steamAppID: '2000',
    metacriticLink: '',
  },
];

describe('SearchResults', () => {
  it('renders "Search Results" heading', () => {
    render(<SearchResults deals={[]} query="" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Search Results');
  });

  it('shows query in heading when query provided', () => {
    render(<SearchResults deals={[]} query="cyberpunk" />);
    expect(screen.getByText(/for "cyberpunk"/)).toBeInTheDocument();
  });

  it('shows "All Deals" when no query', () => {
    render(<SearchResults deals={[]} query="" />);
    expect(screen.getByText(/All Deals/)).toBeInTheDocument();
  });

  it('shows deal count', () => {
    render(<SearchResults deals={mockDeals} query="" />);
    expect(screen.getByText(/Found 2 deals/)).toBeInTheDocument();
  });

  it('renders GameCard for each deal', () => {
    render(<SearchResults deals={mockDeals} query="" />);
    const cards = screen.getAllByTestId('game-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-dealid', '1');
    expect(cards[1]).toHaveAttribute('data-dealid', '2');
  });

  it('shows "No deals found." when empty', () => {
    render(<SearchResults deals={[]} query="nonexistent" />);
    expect(screen.getByText('No deals found.')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting/)).toBeInTheDocument();
  });

  it('getDealsWithParams calls getDeals with correct params', async () => {
    const { getDeals } = await import('@/services/api');
    const mockGetDeals = vi.mocked(getDeals);
    mockGetDeals.mockResolvedValueOnce([]);

    await getDealsWithParams('doom', '20', '1');

    expect(mockGetDeals).toHaveBeenCalledWith({
      onSale: '1',
      title: 'doom',
      upperPrice: '20',
      storeID: '1',
    });
  });

  it('getDealsWithParams returns [] on error', async () => {
    const { getDeals } = await import('@/services/api');
    const mockGetDeals = vi.mocked(getDeals);
    mockGetDeals.mockRejectedValueOnce(new Error('network'));

    const result = await getDealsWithParams('test');
    expect(result).toEqual([]);
  });
});
