### Task 2: StoreComparison — conditional render & best-price logic

**Files:**
- Create: `src/components/game/StoreComparison.test.tsx`

**Interfaces:**
- Consumes: `StoreComparisonProps` — officialDeals, keyshopDeals, cheapestEver, gameTitle, stores
- Uses: `sortDealsByPrice` from `@/lib/game-data` (already tested — test through component)

- [ ] **Step 1: Write test file**

```tsx
/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StoreComparison from './StoreComparison';
import type { GameDeal } from '@/types/game';

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

// biome-ignore lint/style/useNamingConvention: CSS module mock
const stylesMock = { storeComparison: 'sc', sectionTitle: 'st', dealsList: 'dl', keyshopTitle: 'kt' };
vi.mock('./StoreComparison.module.css', () => ({ default: stylesMock }));

function makeDeal(overrides: Partial<GameDeal> = {}): GameDeal {
  return {
    dealID: 'd1',
    storeID: '1',
    gameID: 'g1',
    title: 'Test Game',
    salePrice: '19.99',
    normalPrice: '59.99',
    savings: '66.67',
    metacriticScore: '85',
    steamRatingText: 'Very Positive',
    steamRatingPercent: '95',
    steamRatingCount: '1000',
    thumb: 'https://example.com/thumb.jpg',
    ...overrides,
    // Ensure price parity if salePrice overridden
    salePrice: overrides.salePrice ?? '19.99',
  };
}

describe('StoreComparison', () => {
  const stores = { '1': 'Steam', '2': 'GOG' };

  it('renders official stores section when there are official deals', () => {
    const official = [makeDeal({ dealID: 'd1', storeID: '1', salePrice: '29.99' })];
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
      makeDeal({ dealID: 'cheap', salePrice: '9.99' }),
      makeDeal({ dealID: 'expensive', salePrice: '29.99' }),
    ];
    render(
      <StoreComparison
        officialDeals={official}
        keyshopDeals={[]}
        cheapestEver={5.00}
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
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/components/game/StoreComparison.test.tsx`
Expected: 6 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/components/game/StoreComparison.test.tsx
git commit -m "test(components): StoreComparison conditional render and best-price flag"
```

---

