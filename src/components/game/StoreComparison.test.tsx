/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GameDeal } from '@/types/game';
import StoreComparison from './StoreComparison';

vi.mock('@/lib/game-data', () => ({
  sortDealsByPrice: (deals: GameDeal[]) =>
    [...deals].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)),
}));

vi.mock('./GameDealRow', () => ({
  default: ({ deal, isBest }: { deal: GameDeal; isBest: boolean }) => (
    <tr data-testid={`deal-${deal.dealID}`} data-best={isBest}>
      <td>{deal.price}</td>
    </tr>
  ),
}));

const stylesMock = vi.hoisted(() => ({
  storeComparison: 'sc',
  sectionTitle: 'st',
  dealsList: 'dl',
  keyshopTitle: 'kt',
}));
vi.mock('./StoreComparison.module.css', () => ({ default: stylesMock }));

function makeDeal(overrides: Partial<GameDeal> = {}): GameDeal {
  return {
    storeID: '1',
    dealID: 'd1',
    price: '19.99',
    retailPrice: '59.99',
    savings: '66.67',
    dealRating: '9.5',
    ...overrides,
  };
}

describe('StoreComparison', () => {
  const stores = { '1': 'Steam', '2': 'GOG' };

  it('renders official stores section when there are official deals', () => {
    const official = [makeDeal({ dealID: 'd1', storeID: '1', price: '29.99' })];
    render(
      <StoreComparison
        officialDeals={official}
        keyshopDeals={[]}
        cheapestEver={9.99}
        gameTitle="Game"
        stores={stores}
      />
    );
    expect(screen.getByText('Official Stores')).toBeInTheDocument();
    expect(screen.getByTestId('deal-d1')).toBeInTheDocument();
  });

  it('does not render official stores section when there are no official deals', () => {
    render(
      <StoreComparison
        officialDeals={[]}
        keyshopDeals={[makeDeal({ dealID: 'd2', storeID: '2' })]}
        cheapestEver={9.99}
        gameTitle="Game"
        stores={stores}
      />
    );
    expect(screen.queryByText('Official Stores')).not.toBeInTheDocument();
  });

  it('renders keyshops section when there are keyshop deals', () => {
    render(
      <StoreComparison
        officialDeals={[]}
        keyshopDeals={[makeDeal({ dealID: 'd2', storeID: '2' })]}
        cheapestEver={9.99}
        gameTitle="Game"
        stores={stores}
      />
    );
    expect(screen.getByText('Keyshops')).toBeInTheDocument();
    expect(screen.getByTestId('deal-d2')).toBeInTheDocument();
  });

  it('does not render keyshops section when empty', () => {
    render(
      <StoreComparison
        officialDeals={[makeDeal({ dealID: 'd1', storeID: '1' })]}
        keyshopDeals={[]}
        cheapestEver={9.99}
        gameTitle="Game"
        stores={stores}
      />
    );
    expect(screen.queryByText('Keyshops')).not.toBeInTheDocument();
  });

  it('marks best official deal with isBest=true', () => {
    const official = [
      makeDeal({ dealID: 'cheap', price: '9.99' }),
      makeDeal({ dealID: 'expensive', price: '29.99' }),
    ];
    render(
      <StoreComparison
        officialDeals={official}
        keyshopDeals={[]}
        cheapestEver={5.0}
        gameTitle="Game"
        stores={stores}
      />
    );
    expect(screen.getByTestId('deal-cheap')).toHaveAttribute('data-best', 'true');
    expect(screen.getByTestId('deal-expensive')).toHaveAttribute('data-best', 'false');
  });

  it('renders nothing when both lists are empty', () => {
    const { container } = render(
      <StoreComparison
        officialDeals={[]}
        keyshopDeals={[]}
        cheapestEver={0}
        gameTitle="Game"
        stores={stores}
      />
    );
    // Container should only have the wrapper div with no children
    const storeComparison = container.firstChild as HTMLElement;
    expect(storeComparison?.childNodes.length ?? 0).toBe(0);
  });
});
