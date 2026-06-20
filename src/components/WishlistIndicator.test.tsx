/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', () => ({
  Heart: (props: Record<string, unknown>) => <div data-testid="heart-icon" {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

let mockWishlist: string[] = [];
vi.mock('@/store/wishlistStore', () => ({
  useWishlist: vi.fn(() => ({ wishlist: mockWishlist })),
}));

import WishlistIndicator from './WishlistIndicator';

describe('WishlistIndicator', () => {
  beforeEach(() => {
    mockWishlist = [];
  });

  it('renders "Wishlist" text', () => {
    render(<WishlistIndicator />);
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
  });

  it('links to /wishlist', () => {
    render(<WishlistIndicator />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/wishlist');
  });

  it('shows badge when wishlist has items', () => {
    mockWishlist = ['1', '2', '3'];
    render(<WishlistIndicator />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show badge when wishlist is empty', () => {
    render(<WishlistIndicator />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
