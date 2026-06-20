/**
 * @vitest-environment jsdom
 */

import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FlashSales from './FlashSales';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, fill: _fill, sizes: _sizes, className: _className, ...rest } = props;
    return <div data-src={String(src)} data-alt={String(alt)} {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockDeal = {
  internalName: 'TESTGAME',
  title: 'Test Game',
  dealID: 'deal_001',
  storeID: '1',
  gameID: '999',
  salePrice: '9.99',
  normalPrice: '19.99',
  isOnSale: '1',
  savings: '50.00',
  metacriticScore: '80',
  steamRatingText: 'Very Positive',
  steamRatingPercent: '90',
  steamRatingCount: '1000',
  steamAppID: '12345',
  releaseDate: 1600000000,
  lastChange: 1600000000,
  dealRating: '8.5',
  thumb: 'https://example.com/thumb.jpg',
  metacriticLink: '/game/pc/test-game',
};

describe('FlashSales', () => {
  it('renders nothing for empty deals', () => {
    const { container } = render(<FlashSales deals={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for undefined deals', () => {
    const { container } = render(<FlashSales deals={undefined as never} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders deals with discount badge', () => {
    render(<FlashSales deals={[mockDeal]} />);
    expect(screen.getByText('⚡ Flash Deals')).toBeInTheDocument();
    expect(screen.getByText('-50%')).toBeInTheDocument();
    expect(screen.getByText('9.99')).toBeInTheDocument();
    expect(screen.getByText(/Claimed/)).toBeInTheDocument();
  });

  it('renders View All link', () => {
    render(<FlashSales deals={[mockDeal]} />);
    expect(screen.getByText('View All >')).toHaveAttribute('href', '/search');
  });

  it('renders game link with correct href', () => {
    render(<FlashSales deals={[mockDeal]} />);
    const links = screen.getAllByRole('link');
    const gameLink = links.find((l) => l.getAttribute('href') === '/game/999');
    expect(gameLink).toBeDefined();
  });

  it('limits to 8 deals', () => {
    const deals = Array.from({ length: 12 }, (_, i) => ({
      ...mockDeal,
      dealID: `deal_${i}`,
      gameID: `${i}`,
      title: `Game ${i}`,
    }));
    render(<FlashSales deals={deals} />);
    expect(screen.getAllByText(/Claimed/)).toHaveLength(8);
  });

  describe('timer', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('counts down and updates display', () => {
      render(<FlashSales deals={[mockDeal]} />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('04')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('clears interval when component unmounts', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      const { unmount } = render(<FlashSales deals={[mockDeal]} />);
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
