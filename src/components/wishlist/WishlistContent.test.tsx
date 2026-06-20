/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SavedGame } from '@/hooks/useSortedGames';
import type { PriceAlert } from '@/types/price-alert';
import WishlistContent from './WishlistContent';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
      variants?: unknown;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

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
    isInWishlist: () => true,
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

vi.mock('@/hooks/useShareWishlist', () => ({
  useShareWishlist: () => ({ copied: false, share: vi.fn() }),
}));

const cssProxy = vi.hoisted(
  () => new Proxy({}, { get: (_: unknown, k: string) => (typeof k === 'string' ? k : '') })
);

vi.mock('./WishlistGrid.module.css', () => ({ default: cssProxy }));
vi.mock('./WishlistStats.module.css', () => ({ default: cssProxy }));
vi.mock('./AlertsGrid.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/HeartButton.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/PriceAlertTrigger.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/AuthModal.module.css', () => ({ default: cssProxy }));
vi.mock('@/components/PriceAlertModal.module.css', () => ({ default: cssProxy }));

const savedGames: SavedGame[] = [
  {
    gameID: 'g1',
    title: 'Game',
    thumb: '',
    salePrice: '5',
    normalPrice: '10',
    savings: 50,
    storeID: '1',
  },
];

const alerts: PriceAlert[] = [
  {
    gameID: 'a1',
    gameTitle: 'Alert Game',
    targetPrice: 5,
    currentPrice: 10,
    isKeyshopAllowed: false,
    createdAt: 1,
  },
];

const defaultProps = {
  activeTab: 'wishlist' as const,
  isLoading: false,
  savedGames,
  displayedGames: savedGames,
  stores: { '1': 'Steam' },
  alerts,
  bestDiscountGame: null,
  totalValue: '9.99',
  sortMode: 'discount' as const,
  onSortModeChange: vi.fn(),
  wishlist: ['g1'],
};

describe('WishlistContent', () => {
  it('renders AlertsGrid when activeTab is alerts', () => {
    render(<WishlistContent {...defaultProps} activeTab="alerts" />);
    expect(screen.getByText('Alert Game')).toBeInTheDocument();
    expect(screen.queryByText('Portfolio Value')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<WishlistContent {...defaultProps} isLoading />);
    expect(screen.getByText('Loading your games...')).toBeInTheDocument();
  });

  it('shows empty state when savedGames is empty', () => {
    render(<WishlistContent {...defaultProps} savedGames={[]} displayedGames={[]} />);
    expect(screen.getByText('Your wishlist is empty :(')).toBeInTheDocument();
  });

  it('renders stats and grid when games exist', () => {
    render(<WishlistContent {...defaultProps} />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('Game')).toBeInTheDocument();
  });

  it('renders share button when games exist', () => {
    render(<WishlistContent {...defaultProps} />);
    expect(screen.getByText('🔗 Share Wishlist')).toBeInTheDocument();
  });

  it('renders sort select', () => {
    render(<WishlistContent {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('passes alerts to AlertsGrid correctly', () => {
    const multipleAlerts: PriceAlert[] = [
      {
        gameID: 'a1',
        gameTitle: 'Alert One',
        targetPrice: 5,
        currentPrice: 10,
        isKeyshopAllowed: true,
        createdAt: 1,
      },
      {
        gameID: 'a2',
        gameTitle: 'Alert Two',
        targetPrice: 3,
        currentPrice: 8,
        isKeyshopAllowed: false,
        createdAt: 2,
      },
    ];
    render(<WishlistContent {...defaultProps} activeTab="alerts" alerts={multipleAlerts} />);
    expect(screen.getByText('Alert One')).toBeInTheDocument();
    expect(screen.getByText('Alert Two')).toBeInTheDocument();
  });
});
