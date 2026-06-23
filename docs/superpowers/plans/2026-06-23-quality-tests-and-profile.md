# Quality Tests & Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real quality tests for components with business logic + fix `/profile` 404 + cover critical lib gap.

**Architecture:** Component tests use `@testing-library/react` with mocked API/Supabase. Lib tests are pure function tests. Profile page is a protected server component with user data from Supabase session.

**Tech Stack:** Vitest + @testing-library/react + jsdom + Drizzle + Supabase SSR

## Global Constraints

- No new dependencies beyond what's already in package.json
- All tests must use existing patterns (vitest, @testing-library/react, vi.mock for API/Supabase)
- Server Actions use `'use server'` — test via call, not render
- CSS module imports use `vi.mock('*.module.css', () => ({}))` pattern
- Kebab-case file names. Single quotes. No `any` without comment.
- Profile page must hydrate from `createClient()` — same pattern as /wishlist, /alerts

---

## File Structure

### Files to Create
```
src/components/HistoricalLows.test.tsx
src/components/game/StoreComparison.test.tsx
src/components/AddToListButton.test.tsx
src/lib/affiliate-config.test.ts
src/app/profile/page.tsx
```

### Files to Modify
```
src/utils/supabase/middleware.ts              (add /profile to PROtECTED_PATHS — already there, verify)
src/app/profile/page.tsx                      (create from scratch)
```

---

### Task 1: AddToListButton — interaction & variant test

**Files:**
- Create: `src/components/AddToListButton.test.tsx`
- Mock: `src/components/AddToListModal` (already tested, mock it)

**Interfaces:**
- Consumes: `AddToListButton` component props: `{ gameId: string; variant?: 'icon' | 'full' }`
- Produces: test for event propagation, state toggle, variant rendering

- [ ] **Step 1: Write the test file**

```tsx
/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddToListButton from './AddToListButton';

vi.mock('./AddToListModal', () => ({
  default: ({ gameId, onClose }: { gameId: string; onClose: () => void }) => (
    <div data-testid="add-to-list-modal">
      <span>{gameId}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('AddToListButton', () => {
  it('renders icon variant by default', () => {
    render(<AddToListButton gameId="123" />);
    const button = screen.getByTitle('Add to Playlist');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent('Add to List');
  });

  it('renders full variant with label', () => {
    render(<AddToListButton gameId="123" variant="full" />);
    const button = screen.getByTitle('Add to Playlist');
    expect(button).toHaveTextContent('Add to List');
  });

  it('shows modal on button click', () => {
    render(<AddToListButton gameId="456" />);
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
  });

  it('closes modal when onClose is called', () => {
    render(<AddToListButton gameId="456" />);
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(screen.getByTestId('add-to-list-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('add-to-list-modal')).not.toBeInTheDocument();
  });

  it('stops event propagation on click', () => {
    const parentClick = vi.fn();
    render(
      // biome-ignore lint/a11y/useKeyEvents: test wrapper
      <div onClick={parentClick}>
        <AddToListButton gameId="123" />
      </div>
    );
    fireEvent.click(screen.getByTitle('Add to Playlist'));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/components/AddToListButton.test.tsx`
Expected: 5 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/components/AddToListButton.test.tsx
git commit -m "test(components): AddToListButton interaction and variant coverage"
```

---

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

### Task 3: HistoricalLows — async data flow & empty/null state

**Files:**
- Create: `src/components/HistoricalLows.test.tsx`

**Interfaces:**
- Consumes: `getDeals` and `getGame` from `@/services/api` (both mocked)
- Produces: test for dedup logic, verification pass/fail, empty state, render

- [ ] **Step 1: Write test file**

```tsx
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

const getDealsMock = vi.fn();
const getGameMock = vi.fn();
vi.mock('@/services/api', () => ({
  getDeals: (...args: unknown[]) => getDealsMock(...args),
  getGame: (...args: unknown[]) => getGameMock(...args),
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

    getGameMock.mockImplementation((id: string) =>
      Promise.resolve({
        cheapestPriceEver: {
          price: id === '1' ? '9.99' : '12.00', // id=1 passes (within 1%), id=2 fails
          date: '2024-01-01',
        },
      })
    );

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

    getGameMock.mockResolvedValue({
      cheapestPriceEver: { price: '9.99', date: '2024-01-01' },
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

    getGameMock.mockResolvedValue({
      cheapestPriceEver: { price: '5.00', date: '2024-01-01' }, // current > 1% of HL
    });

    const result = await HistoricalLows();
    expect(result).toBeNull();
  });

  it('handles gameInfo with no cheapestPriceEver gracefully', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGameMock.mockResolvedValue(null);

    const result = await HistoricalLows();
    expect(result).toBeNull();
  });

  it('handles rejected promises from getGame (API failure)', async () => {
    getDealsMock
      .mockResolvedValueOnce([makeDeal('1', '9.99'), makeDeal('2', '9.99')])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    getGameMock.mockRejectedValueOnce(new Error('API error')).mockResolvedValueOnce({
      cheapestPriceEver: { price: '9.99', date: '2024-01-01' },
    });

    const { container } = render(await HistoricalLows());

    // Only the fulfilled promise that passes verification renders
    const deals = container.querySelectorAll('[data-testid^="deal-"]');
    expect(deals.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/components/HistoricalLows.test.tsx`
Expected: 6 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/components/HistoricalLows.test.tsx
git commit -m "test(components): HistoricalLows async verification pipeline"
```

---

### Task 4: affiliate-config — validation & URL logic

**Files:**
- Create: `src/lib/affiliate-config.test.ts`

**Interfaces:**
- Tests: `affiliateConfig`, `ALLOWED_DOMAINS`, `isValidStoreId`, `isValidGameSlug`

- [ ] **Step 1: Write test file**

```ts
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_DOMAINS,
  affiliateConfig,
  isValidGameSlug,
  isValidStoreId,
} from './affiliate-config';

describe('affiliateConfig', () => {
  it('has 17 stores', () => {
    expect(Object.keys(affiliateConfig)).toHaveLength(17);
  });

  it('every config has a valid baseUrl', () => {
    Object.values(affiliateConfig).forEach((c) => {
      expect(() => new URL(c.baseUrl)).not.toThrow();
    });
  });
});

describe('ALLOWED_DOMAINS', () => {
  it('includes steam', () => {
    expect(ALLOWED_DOMAINS.has('store.steampowered.com')).toBe(true);
  });

  it('matches each config entry', () => {
    Object.values(affiliateConfig).forEach((c) => {
      const hostname = new URL(c.baseUrl).hostname;
      expect(ALLOWED_DOMAINS.has(hostname)).toBe(true);
    });
  });
});

describe('isValidStoreId', () => {
  it('returns true for valid numeric IDs', () => {
    expect(isValidStoreId('1')).toBe(true);
    expect(isValidStoreId('7')).toBe(true);
    expect(isValidStoreId('104')).toBe(true);
  });

  it('returns false for unknown store IDs', () => {
    expect(isValidStoreId('999')).toBe(false);
    expect(isValidStoreId('0')).toBe(false);
  });

  it('returns false for non-numeric input', () => {
    expect(isValidStoreId('abc')).toBe(false);
    expect(isValidStoreId('')).toBe(false);
    expect(isValidStoreId('12a')).toBe(false);
  });
});

describe('isValidGameSlug', () => {
  it('returns true for valid slugs', () => {
    expect(isValidGameSlug('half-life-2')).toBe(true);
    expect(isValidGameSlug('cyberpunk_2077')).toBe(true);
    expect(isValidGameSlug('a')).toBe(true);
  });

  it('returns false for empty slug', () => {
    expect(isValidGameSlug('')).toBe(false);
  });

  it('returns false for slug over 100 chars', () => {
    expect(isValidGameSlug('a'.repeat(101))).toBe(false);
  });

  it('returns false for slugs with special chars', () => {
    expect(isValidGameSlug('../etc/passwd')).toBe(false);
    expect(isValidGameSlug('game<script>')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/lib/affiliate-config.test.ts`
Expected: 12 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add src/lib/affiliate-config.test.ts
git commit -m "test(lib): affiliate-config validation and URL logic"
```

---

### Task 5: Profile page — kill the 404

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/__tests__/page.test.tsx`
- Modify: (none — PROTECTED_PATHS already includes /profile)

**Interfaces:**
- Consumes: `createClient()` from `@/utils/supabase/server` to get session user
- Produces: `/profile` page showing user email, provider, account creation date

- [ ] **Step 1: Create profile page**

```tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/auth-code-error');
  }

  const provider = user.identities?.[0]?.provider ?? 'email';
  const created = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p className="text-base">{user.email}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Provider</span>
          <p className="text-base capitalize">{provider}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Member since</span>
          <p className="text-base">{created}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create profile page test**

```tsx
/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from './page';

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));

const getUserMock = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

describe('ProfilePage', () => {
  it('renders user info when authenticated', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          created_at: '2024-06-01T00:00:00Z',
          identities: [{ provider: 'google' }],
        },
      },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('google')).toBeInTheDocument();
    expect(screen.getByText(/June 1, 2024/)).toBeInTheDocument();
  });

  it('redirects when no user is returned', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    render(await ProfilePage());

    expect(redirectMock).toHaveBeenCalledWith('/auth/auth-code-error');
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm vitest run src/app/profile/`
Expected: 2 passed, 0 failed

- [ ] **Step 4: Build check**

Run: `pnpm build`
Expected: Build succeeds, `/profile` route listed in output

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/
git commit -m "feat(profile): kill 404 — basic profile page with user info"
```

---

### Task 6: Final verification

- [ ] **Run full test suite**

Run: `pnpm vitest run`
Expected: 935+ passed (923 + 12 new), 0 failed

- [ ] **Run build**

Run: `pnpm build`
Expected: Success, 0 warnings

- [ ] **Run full audit**

Run: `pnpm audit`
Expected: 0 vulnerabilities

- [ ] **Run lint**

Run: `./node_modules/.bin/biome check .`
Expected: Only pre-existing SVG title errors, no new issues
