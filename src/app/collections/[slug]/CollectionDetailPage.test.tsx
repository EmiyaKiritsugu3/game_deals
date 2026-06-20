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
  getGame: vi.fn(),
}));

import { notFound } from 'next/navigation';
import { getGame } from '@/services/api';
import CollectionDetailPage, { generateStaticParams } from './page';

const mockGetGame = vi.mocked(getGame);

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
        salePrice: overrides.price ?? '9.99',
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
    mockGetGame.mockResolvedValue(createMockGameDetails() as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🎮 Test Collection');
  });

  it('renders collection description', async () => {
    mockGetGame.mockResolvedValue(createMockGameDetails() as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByText('A test collection.')).toBeInTheDocument();
  });

  it('renders game rows with titles', async () => {
    mockGetGame
      .mockResolvedValueOnce(createMockGameDetails({ title: 'Game Alpha' }) as never)
      .mockResolvedValueOnce(createMockGameDetails({ title: 'Game Beta' }) as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getByText('Game Alpha')).toBeInTheDocument();
    expect(screen.getByText('Game Beta')).toBeInTheDocument();
  });

  it('shows "FREE" for free games', async () => {
    mockGetGame.mockResolvedValue(createMockGameDetails({ price: '0.00' }) as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getAllByText('FREE').length).toBeGreaterThan(0);
  });

  it('shows price for paid games', async () => {
    mockGetGame.mockResolvedValue(createMockGameDetails({ price: '9.99' }) as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    expect(screen.getAllByText('$9.99').length).toBeGreaterThan(0);
  });

  it('links to /game/{gameID}', async () => {
    mockGetGame.mockResolvedValue(createMockGameDetails() as never);
    const params = Promise.resolve({ slug: 'test-collection' });
    render(await CollectionDetailPage({ params }));
    const links = screen.getAllByRole('link');
    const gameLink = links.find((l) => l.getAttribute('href')?.includes('/game/'));
    expect(gameLink).toBeDefined();
  });

  it('generateStaticParams returns slugs', async () => {
    const result = await generateStaticParams();
    expect(result).toEqual(
      expect.arrayContaining([{ slug: 'test-collection' }, { slug: 'empty-collection' }])
    );
  });
});
