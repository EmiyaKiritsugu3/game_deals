/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const gameDealRowMocks = vi.hoisted(() => ({
  buildDealRowProps: vi.fn(() => ({
    savings: 80,
    isDealAtHL: false,
    isFree: false,
    isEpicDeal: true,
    price: 9.99,
  })),
  buildOutUrl: vi.fn(() => '/out?url=test&store=Steam'),
  getStoreLogo: vi.fn(() => '/logos/steam.png'),
  getDrmType: vi.fn(() => ({ label: 'Steam DRM', icon: '\uD83D\uDCBF' })),
  getRegionTag: vi.fn(() => null),
}));

vi.mock('@/lib/game-data', () => ({
  buildDealRowProps: gameDealRowMocks.buildDealRowProps,
  buildOutUrl: gameDealRowMocks.buildOutUrl,
}));

vi.mock('@/services/api', () => ({
  getStoreLogo: gameDealRowMocks.getStoreLogo,
  getDrmType: gameDealRowMocks.getDrmType,
  getRegionTag: gameDealRowMocks.getRegionTag,
}));

vi.mock('zustand/middleware', () => ({
  persist: (config: unknown, _options: Record<string, unknown>) => config,
}));

const filterSidebarMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: filterSidebarMocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));

const searchBoxMocks = vi.hoisted(() => ({
  setQuery: vi.fn(),
  searchGamesAction: vi.fn(),
}));

vi.mock('nuqs', () => ({
  useQueryState: () => ['', searchBoxMocks.setQuery],
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, className, ...props }, children as React.ReactNode),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/actions/search', () => ({
  searchGamesAction: searchBoxMocks.searchGamesAction,
}));

vi.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: () => React.createRef<HTMLDivElement>(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('GameDealRow aria-labels', () => {
  it('has aria-label on the deal link with game title', async () => {
    const GameDealRow = (await import('@/components/game/GameDealRow')).default;
    const { container } = render(
      <GameDealRow
        deal={{
          storeID: '1',
          dealID: 'deal123',
          price: '9.99',
          retailPrice: '49.99',
          savings: '80',
          dealRating: '10',
        }}
        isBest={false}
        cheapestEver={5.99}
        gameTitle="Test Game"
        stores={{ '1': 'Steam' }}
      />
    );

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('aria-label', 'Test Game');
  });
});

describe('FilterSidebar aria-labels', () => {
  it('has aria-label on the filter container', async () => {
    const FilterSidebar = (await import('@/components/FilterSidebar')).default;
    const { container } = render(<FilterSidebar stores={[{ storeID: '1', storeName: 'Steam' }]} />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Filters');
  });

  it('has aria-label on the price input', async () => {
    const FilterSidebar = (await import('@/components/FilterSidebar')).default;
    render(<FilterSidebar stores={[{ storeID: '1', storeName: 'Steam' }]} />);

    const priceInput = screen.getByPlaceholderText('Any');
    expect(priceInput).toHaveAttribute('aria-label', 'Maximum price');
  });

  it('has aria-label on store checkboxes', async () => {
    const FilterSidebar = (await import('@/components/FilterSidebar')).default;
    const { container } = render(
      <FilterSidebar
        stores={[
          { storeID: '1', storeName: 'Steam' },
          { storeID: '2', storeName: 'GOG' },
        ]}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0]).toHaveAttribute('aria-label', 'Steam');
    expect(checkboxes[1]).toHaveAttribute('aria-label', 'GOG');
  });
});

describe('SearchBox aria-labels', () => {
  it('has aria-label="Search games" on the search input', async () => {
    const { SearchBox } = await import('@/components/navbar/SearchBox');
    render(<SearchBox />);

    const input = screen.getByRole('textbox', { name: /Search games/i });
    expect(input).toBeInTheDocument();
  });

  it('has role="search" on the search form', async () => {
    const { SearchBox } = await import('@/components/navbar/SearchBox');
    const { container } = render(<SearchBox />);

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('role', 'search');
  });
});
