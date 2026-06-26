/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SavedGame } from '@/hooks/useSortedGames';
import WishlistGrid from './WishlistGrid';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => ({
    wishlist: ['g1'],
    isInWishlist: (id: string) => id === 'g1',
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock('@/store/alertStore', () => ({
  useAlerts: () => ({
    hasAlert: () => false,
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    user: null,
  }),
}));

vi.mock('@/components/PriceAlertModal', () => ({
  default: () => null,
}));

vi.mock('@/components/AuthModal', () => ({
  default: () => null,
}));

const cssProxy = vi.hoisted(
  () => new Proxy({}, { get: (_: unknown, k: string) => (typeof k === 'string' ? k : '') })
);

vi.mock('./WishlistGrid.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/PriceAlertModal.module.css', () => ({ default: cssProxy }));

const makeGame = (overrides: Partial<SavedGame> = {}): SavedGame => ({
  gameID: 'g1',
  title: 'Test Game',
  thumb: 'https://example.com/thumb.jpg',
  salePrice: '9.99',
  normalPrice: '29.99',
  savings: 67,
  storeID: '1',
  ...overrides,
});

const stores: Record<string, string> = { '1': 'Steam' };

describe('WishlistGrid', () => {
  it('shows loading state when isLoading is true', () => {
    render(<WishlistGrid games={[]} stores={stores} isLoading />);
    expect(screen.getByText('Loading your games...')).toBeInTheDocument();
  });

  it('shows empty state when games array is empty', () => {
    render(<WishlistGrid games={[]} stores={stores} />);
    expect(screen.getByText('Your wishlist is empty :(')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover Epic Deals' })).toHaveAttribute('href', '/');
  });

  it('renders game cards with title, prices, and savings', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('-67%')).toBeInTheDocument();
  });

  it('hides normal price and savings badge when savings is 0', () => {
    render(<WishlistGrid games={[makeGame({ savings: 0 })]} stores={stores} />);
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.queryByText('$29.99')).not.toBeInTheDocument();
    expect(screen.queryByText(/-%/)).not.toBeInTheDocument();
  });

  it('shows store name from stores map', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    expect(screen.getByText('Steam')).toBeInTheDocument();
  });

  it('falls back to Store {id} when store name not found', () => {
    render(<WishlistGrid games={[makeGame({ storeID: '99' })]} stores={stores} />);
    expect(screen.getByText('Store 99')).toBeInTheDocument();
  });

  it('renders game image with correct alt and src', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    const img = screen.getByRole('img', { name: 'Test Game' });
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('renders View Details link with correct href', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', '/game/g1');
  });

  it('renders HeartButton for each game', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    const heartBtn = screen.getByRole('button', { name: /Wishlist/ });
    expect(heartBtn).toBeInTheDocument();
  });

  it('renders PriceAlertTrigger for each game', () => {
    render(<WishlistGrid games={[makeGame()]} stores={stores} />);
    expect(screen.getByTestId('price-alert-trigger')).toBeInTheDocument();
  });

  it('renders multiple game cards', () => {
    const games = [makeGame(), makeGame({ gameID: 'g2', title: 'Game Two' })];
    render(<WishlistGrid games={games} stores={stores} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('Game Two')).toBeInTheDocument();
  });
});
