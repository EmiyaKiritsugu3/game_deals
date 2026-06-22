// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => ({
    isInWishlist: () => false,
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock('@/components/HeartButton', () => ({
  default: ({ gameID, className }: { gameID: string; className?: string }) => (
    <button data-testid={`heart-${gameID}`} className={className} type="button">
      Heart
    </button>
  ),
}));

vi.mock('@/components/PriceAlertTrigger', () => ({
  default: ({ gameID }: { gameID: string }) => (
    <button data-testid={`alert-${gameID}`} type="button">
      Alert
    </button>
  ),
}));

import WishlistGrid from '@/components/wishlist/WishlistGrid';

const mockGames = [
  {
    gameID: '123',
    title: 'Test Game',
    thumb: '/test.jpg',
    salePrice: '9.99',
    normalPrice: '19.99',
    savings: 50,
    storeID: '1',
  },
];

describe('WishlistGrid', () => {
  it('renders heart button before alert button in DOM order', () => {
    render(<WishlistGrid games={mockGames} stores={{ '1': 'Steam' }} />);
    const heart = screen.getByTestId('heart-123');
    const alert = screen.getByTestId('alert-123');
    expect(heart.compareDocumentPosition(alert)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
