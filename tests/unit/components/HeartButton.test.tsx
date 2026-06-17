/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isInWishlist: vi.fn(),
  toggleWishlist: vi.fn(),
}));

vi.mock('zustand/middleware', () => ({
  persist: (config: unknown, _options: Record<string, unknown>) => config,
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlist: () => ({
    isInWishlist: mocks.isInWishlist,
    toggleWishlist: mocks.toggleWishlist,
  }),
}));

vi.mock('@/components/HeartButton.module.css', () => ({
  default: new Proxy({}, { get: (_, prop) => String(prop) }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeartButton', () => {
  it('renders with Add to Wishlist aria-label when game is not saved', async () => {
    mocks.isInWishlist.mockReturnValue(false);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
    });
  });

  it('renders with Remove from Wishlist aria-label when game is saved', async () => {
    mocks.isInWishlist.mockReturnValue(true);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove from Wishlist/i })).toBeInTheDocument();
    });
  });

  it('calls toggleWishlist when clicked', async () => {
    mocks.isInWishlist.mockReturnValue(false);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Add to Wishlist/i });
    fireEvent.click(button);

    expect(mocks.toggleWishlist).toHaveBeenCalledWith('123');
  });

  it('calls preventDefault and stopPropagation on click', async () => {
    mocks.isInWishlist.mockReturnValue(false);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
    });

    const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(Event.prototype, 'stopPropagation');

    const button = screen.getByRole('button', { name: /Add to Wishlist/i });
    fireEvent.click(button);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
    stopPropagationSpy.mockRestore();
  });

  it('applies saved className when in wishlist', async () => {
    mocks.isInWishlist.mockReturnValue(true);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Remove from Wishlist/i });
      expect(button.className).toContain('saved');
    });
  });

  it('applies custom className prop', async () => {
    mocks.isInWishlist.mockReturnValue(false);

    const HeartButton = (await import('@/components/HeartButton')).default;
    render(<HeartButton gameID="123" className="my-class" />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Add to Wishlist/i });
      expect(button.className).toContain('my-class');
    });
  });

  it('isInWishlist is not called before mount', async () => {
    mocks.isInWishlist.mockReturnValue(false);

    const HeartButton = (await import('@/components/HeartButton')).default;
    const { container } = render(<HeartButton gameID="123" />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button?.getAttribute('aria-label')).toBe('Add to Wishlist');
  });
});
