/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useShareWishlist } from '@/hooks/useShareWishlist';
import WishlistStats from './WishlistStats';

vi.mock('@/hooks/useShareWishlist', () => ({
  useShareWishlist: vi.fn(() => ({
    copied: false,
    share: vi.fn(),
  })),
}));

const defaultProps = {
  totalValue: '42.50',
  bestDiscountGame: null,
  sortMode: 'discount' as const,
  onSortModeChange: vi.fn(),
  wishlist: ['g1', 'g2'],
};

describe('WishlistStats', () => {
  it('renders portfolio value', () => {
    render(<WishlistStats {...defaultProps} />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('$42.50')).toBeInTheDocument();
  });

  it('shows best discount when bestDiscountGame is provided', () => {
    const game = {
      gameID: 'g1',
      title: 'Game',
      thumb: '',
      salePrice: '5',
      normalPrice: '20',
      savings: 75,
      storeID: '1',
    };
    render(<WishlistStats {...defaultProps} bestDiscountGame={game} />);
    expect(screen.getByText('-75%')).toBeInTheDocument();
  });

  it('hides best discount stat when bestDiscountGame is null', () => {
    render(<WishlistStats {...defaultProps} bestDiscountGame={null} />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.queryByText('-75%')).not.toBeInTheDocument();
  });

  it('renders sort select with three options', () => {
    render(<WishlistStats {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('discount');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Best Discount');
    expect(options[1]).toHaveTextContent('Lowest Price');
    expect(options[2]).toHaveTextContent('Alphabetical');
  });

  it('calls onSortModeChange when sort option is selected', () => {
    const onSort = vi.fn();
    render(<WishlistStats {...defaultProps} onSortModeChange={onSort} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'price' },
    });
    expect(onSort).toHaveBeenCalledWith('price');
  });

  it('renders share button with default text', () => {
    render(<WishlistStats {...defaultProps} />);
    expect(screen.getByText('🔗 Share Wishlist')).toBeInTheDocument();
  });

  it('shows "Link copied!" when copied is true', () => {
    vi.mocked(useShareWishlist).mockReturnValue({
      copied: true,
      share: vi.fn(),
    });

    render(<WishlistStats {...defaultProps} />);
    expect(screen.getByText('✅ Link copied!')).toBeInTheDocument();
  });

  it('calls share when share button is clicked', () => {
    const mockShare = vi.fn();
    vi.mocked(useShareWishlist).mockReturnValue({
      copied: false,
      share: mockShare,
    });

    render(<WishlistStats {...defaultProps} />);
    fireEvent.click(screen.getByText('🔗 Share Wishlist'));
    expect(mockShare).toHaveBeenCalledOnce();
  });

  it('renders sort label', () => {
    render(<WishlistStats {...defaultProps} />);
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
  });

  it('has accessible select element', () => {
    render(<WishlistStats {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select.tagName).toBe('SELECT');
  });
});
