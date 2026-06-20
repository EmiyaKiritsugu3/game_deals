/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockGetDeals = vi.fn();
vi.mock('@/services/api', () => ({
  getDeals: (...args: unknown[]) => mockGetDeals(...args),
}));

vi.mock('./DealRow', () => ({
  default: ({ deal }: { deal: { title: string } }) => (
    <div data-testid="deal-row">{deal.title}</div>
  ),
}));

import EndingSoon from './EndingSoon';

describe('EndingSoon', () => {
  it('returns null for empty deals', async () => {
    mockGetDeals.mockResolvedValue([]);
    const { container } = render(await EndingSoon());
    expect(container.firstChild).toBeNull();
  });

  it('renders section title', async () => {
    mockGetDeals.mockResolvedValue([
      {
        dealID: '1',
        title: 'Game 1',
        storeID: '1',
        gameID: '100',
        salePrice: '9.99',
        normalPrice: '19.99',
        savings: '50',
        thumb: '',
        lastChange: 1,
        steamRatingPercent: '90',
      },
    ]);
    render(await EndingSoon());
    expect(screen.getByText(/⏰ Ending Soon/)).toBeInTheDocument();
  });

  it('renders "SEE ALL" link', async () => {
    mockGetDeals.mockResolvedValue([
      {
        dealID: '1',
        title: 'Game 1',
        storeID: '1',
        gameID: '100',
        salePrice: '9.99',
        normalPrice: '19.99',
        savings: '50',
        thumb: '',
        lastChange: 1,
        steamRatingPercent: '90',
      },
    ]);
    render(await EndingSoon());
    const link = screen.getByText('SEE ALL ▶');
    expect(link).toHaveAttribute('href', '/search?sortBy=Recent');
  });

  it('renders deal rows', async () => {
    mockGetDeals.mockResolvedValue([
      {
        dealID: '1',
        title: 'Game 1',
        storeID: '1',
        gameID: '100',
        salePrice: '9.99',
        normalPrice: '19.99',
        savings: '50',
        thumb: '',
        lastChange: 1,
        steamRatingPercent: '90',
      },
      {
        dealID: '2',
        title: 'Game 2',
        storeID: '1',
        gameID: '101',
        salePrice: '14.99',
        normalPrice: '29.99',
        savings: '50',
        thumb: '',
        lastChange: 1,
        steamRatingPercent: '80',
      },
    ]);
    render(await EndingSoon());
    expect(screen.getAllByTestId('deal-row')).toHaveLength(2);
  });
});
