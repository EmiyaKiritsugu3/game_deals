/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DealWithStore } from '@/lib/types';
import { SearchResults } from './SearchResults';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/game/deal-grid', () => ({
  DealGrid: ({ deals }: { deals: { dealID: string }[] }) => (
    <div data-testid="deal-grid" data-count={deals.length}>
      {deals.map((d) => (
        <div key={d.dealID} data-testid="deal-grid-item" data-deal-id={d.dealID} />
      ))}
    </div>
  ),
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
    salePriceNum: 9.99,
    normalPriceNum: 19.99,
    savingsNum: 50,
    dealRatingNum: 8,
    metacriticScoreNum: 80,
    steamRatingNum: 90,
    releaseDateMs: 0,
    releaseDateLabel: '',
    isFree: false,
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
    salePriceNum: 4.99,
    normalPriceNum: 14.99,
    savingsNum: 66,
    dealRatingNum: 9,
    metacriticScoreNum: 90,
    steamRatingNum: 95,
    releaseDateMs: 0,
    releaseDateLabel: '',
    isFree: false,
  },
] as unknown as DealWithStore[];

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

  it('renders DealGrid passing deals', () => {
    render(<SearchResults deals={mockDeals} query="" />);
    const grid = screen.getByTestId('deal-grid');
    expect(grid).toHaveAttribute('data-count', '2');
    const items = screen.getAllByTestId('deal-grid-item');
    expect(items[0]).toHaveAttribute('data-deal-id', '1');
    expect(items[1]).toHaveAttribute('data-deal-id', '2');
  });

  it('shows singular "deal" when count is 1', () => {
    render(<SearchResults deals={[mockDeals[0]]} query="" />);
    expect(screen.getByText(/Found 1 deal/)).toBeInTheDocument();
  });
});
