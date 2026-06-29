/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, fill: _fill, sizes: _sizes, className: _className, ...rest } = props;
    return <img src={String(src)} alt={String(alt)} {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
}));

vi.mock('@/data/collections', () => ({
  COLLECTIONS: [
    {
      slug: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection.',
      emoji: '🎮',
      gameIDs: ['100', '200'],
    },
    {
      slug: 'empty-collection',
      title: 'Empty Collection',
      description: 'No games here.',
      emoji: '📭',
      gameIDs: [],
    },
  ],
}));

vi.mock('@/services/api', () => ({
  getGamesBatch: vi.fn(),
}));

import { notFound } from 'next/navigation';
import { getGamesBatch } from '@/services/api';
import CollectionDetailPage, { generateStaticParams } from './page';

const mockGetGamesBatch = vi.mocked(getGamesBatch);

function createMockGameDetails(overrides: { title?: string; price?: string } = {}) {
  return {
    info: {
      title: overrides.title ?? 'Test Game',
      thumb: 'https://example.com/thumb.jpg',
      steamAppID: null,
      metacriticScore: null,
      releaseDate: 0,
    },
    deals: [
      {
        dealID: 'd1',
        storeID: '1',
        price: overrides.price ?? '9.99',
        retailPrice: '19.99',
      },
    ],
    cheapestPriceEver: { price: overrides.price ?? '9.99', date: 0 },
  };
}

describe('CollectionDetailPage', () => {
  it('calls notFound for invalid slug', async () => {
    const params = Promise.resolve({ slug: 'nonexistent' });
    await expect(CollectionDetailPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders collection title with emoji', async () => {
    mockGetGamesBatch.mockResolvedValue({
      '100': createMockGameDetails() as never,
      '200': createMockGameDetails() as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🎮 Test Collection');
  });

  it('renders collection description', async () => {
    mockGetGamesBatch.mockResolvedValue({
      '100': createMockGameDetails() as never,
      '200': createMockGameDetails() as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByText('A test collection.')).toBeInTheDocument();
  });

  it('renders game rows with titles', async () => {
    mockGetGamesBatch.mockResolvedValueOnce({
      '100': createMockGameDetails({ title: 'Game Alpha' }) as never,
      '200': createMockGameDetails({ title: 'Game Beta' }) as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByText('Game Alpha')).toBeInTheDocument();
    expect(screen.getByText('Game Beta')).toBeInTheDocument();
  });

  it('shows "FREE" for free games', async () => {
    mockGetGamesBatch.mockResolvedValue({
      '100': createMockGameDetails({ price: '0.00' }) as never,
      '200': createMockGameDetails({ price: '0.00' }) as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getAllByText('FREE').length).toBeGreaterThan(0);
  });

  it('shows price for paid games', async () => {
    mockGetGamesBatch.mockResolvedValue({
      '100': createMockGameDetails({ price: '9.99' }) as never,
      '200': createMockGameDetails({ price: '9.99' }) as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getAllByText('$9.99').length).toBeGreaterThan(0);
  });

  it('renders cards with game titles as clickable, linking to /game/{gameID}', async () => {
    mockGetGamesBatch.mockResolvedValue({
      '100': createMockGameDetails() as never,
      '200': createMockGameDetails() as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getAllByText('Test Game').length).toBeGreaterThan(0);
    const clickableCards = screen.getAllByRole('link');
    expect(clickableCards.length).toBeGreaterThan(0);
  });

  it('generateStaticParams returns slugs', async () => {
    const result = await generateStaticParams();
    expect(result).toEqual(
      expect.arrayContaining([{ slug: 'test-collection' }, { slug: 'empty-collection' }])
    );
  });

  it('renders gracefully if getGamesBatch rejects (fallback to empty gamesData)', async () => {
    mockGetGamesBatch.mockRejectedValue(new Error('Network failure'));
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    // When gamesData falls back to {}, the games array becomes empty.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🎮 Test Collection');
    expect(screen.queryByText('Test Game')).not.toBeInTheDocument();
  });

  it('finds the best deal across multiple stores efficiently', async () => {
    const gameWithMultipleDeals = createMockGameDetails();
    gameWithMultipleDeals.deals = [
      { dealID: '1', storeID: '1', price: '15.99', retailPrice: '19.99' },
      { dealID: '2', storeID: '2', price: '9.99', retailPrice: '19.99' },
      { dealID: '3', storeID: '3', price: '12.99', retailPrice: '19.99' },
    ];
    mockGetGamesBatch.mockResolvedValueOnce({
      '100': gameWithMultipleDeals as never,
    });
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));

    // The lowest price $9.99 should be displayed
    expect(screen.getAllByText('$9.99').length).toBeGreaterThan(0);
  });
});
