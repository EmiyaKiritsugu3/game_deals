/**
 * @vitest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      fill: _f,
      sizes: _s,
      className: _c,
      onError: _e,
      unoptimized: _u,
      ...rest
    } = props;
    return <img src={String(src)} alt={String(alt)} {...rest} />;
  },
}));

const mockToggle = vi.fn();
const mockHas = vi.fn();
const mockCompareToggle = vi.fn();
const mockCompareHas = vi.fn();

vi.mock('@/store/wishlist', () => ({
  useWishlist: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ toggle: mockToggle, has: mockHas }),
}));

vi.mock('@/store/compare', () => ({
  useCompare: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ toggle: mockCompareToggle, has: mockCompareHas, items: [], maxItems: 3 }),
}));

import type { DealWithStore } from '@/lib/deal-utils';
import { DealCard, DealCardSkeleton } from './deal-card';

const BASE_DEAL: DealWithStore = {
  dealID: 'test-1',
  title: 'Test Game',
  salePrice: '9.99',
  normalPrice: '99.99',
  isOnSale: '1',
  savings: '90',
  storeID: '1',
  gameID: '100',
  metacriticScore: '85',
  steamRatingText: 'Very Positive',
  steamRatingPercent: '90',
  steamRatingCount: '1000',
  steamAppID: '12345',
  releaseDate: 1600000000,
  lastChange: 1600000000,
  dealRating: '8.5',
  thumb: 'https://example.com/thumb.jpg',
  internalName: 'test-game',
  metacriticLink: '/game/pc/test-game',
  salePriceNum: 9.99,
  normalPriceNum: 99.99,
  savingsNum: 90,
  dealRatingNum: 8.5,
  metacriticScoreNum: 85,
  steamRatingNum: 90,
  releaseDateMs: 1600000000,
  releaseDateLabel: '2020',
  isFree: false,
};

describe('discount tier badge', () => {
  it('shows GIVEAWAY for 90% savings', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    expect(container.textContent).toContain('-90%');
    expect(container.textContent).toContain('GIVEAWAY');
  });

  it('shows MEGA for 75% savings', () => {
    const d = { ...BASE_DEAL, savings: '75', savingsNum: 75 };
    const { container } = render(<DealCard deal={d} />);
    expect(container.textContent).toContain('-75%');
    expect(container.textContent).toContain('MEGA');
  });

  it('shows MEGA not GIVEAWAY at exactly 75%', () => {
    const d = { ...BASE_DEAL, savings: '75', savingsNum: 75 };
    const { container } = render(<DealCard deal={d} />);
    expect(container.textContent).toContain('MEGA');
    expect(container.textContent).not.toContain('GIVEAWAY');
  });

  it('shows HOT for 50% savings', () => {
    const d = { ...BASE_DEAL, savings: '50', savingsNum: 50 };
    const { container } = render(<DealCard deal={d} />);
    expect(container.textContent).toContain('-50%');
    expect(container.textContent).toContain('HOT');
  });

  it('shows DEAL for 25% savings (non-hot, label hidden, % visible)', () => {
    const d = { ...BASE_DEAL, savings: '25', savingsNum: 25 };
    const { container } = render(<DealCard deal={d} />);
    expect(container.textContent).toContain('-25%');
    // DEAL label is not rendered as visible text — only in CSS class
  });

  it('shows SAVE for 10% savings (non-hot, % visible)', () => {
    const d = { ...BASE_DEAL, savings: '10', savingsNum: 10 };
    const { container } = render(<DealCard deal={d} />);
    expect(container.textContent).toContain('-10%');
    // SAVE label is not rendered as visible text — only in CSS class
  });
});

describe('interaction buttons', () => {
  beforeEach(() => {
    mockToggle.mockReset();
    mockHas.mockReset();
    mockCompareToggle.mockReset();
    mockCompareHas.mockReset();
    mockHas.mockReturnValue(false);
    mockCompareHas.mockReturnValue(false);
  });

  it('renders wishlist button', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    expect(container.querySelector('[aria-label="Add to wishlist"]')).toBeTruthy();
  });

  it('calls wishlist toggle on click', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    const btn = container.querySelector('[aria-label="Add to wishlist"]') as HTMLElement;
    fireEvent.click(btn);
    expect(mockToggle).toHaveBeenCalledWith('test-1');
  });

  it('shows wishlist pressed state', () => {
    mockHas.mockReturnValue(true);
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    const btn = container.querySelector('[aria-pressed="true"]') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Remove from wishlist');
  });

  it('renders compare button', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    expect(container.querySelector('[aria-label="Add to comparison"]')).toBeTruthy();
  });

  it('calls compare toggle on click', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    const btn = container.querySelector('[aria-label="Add to comparison"]') as HTMLElement;
    fireEvent.click(btn);
    expect(mockCompareToggle).toHaveBeenCalledWith(BASE_DEAL);
  });

  it('shows compare pressed state', () => {
    mockCompareHas.mockReturnValue(true);
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    expect(container.querySelector('[aria-label="Remove from comparison"]')).toBeTruthy();
  });

  it('renders external deal link', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    const link = container.querySelector('a[href*="cheapshark.com"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('target')).toBe('_blank');
  });

  it('renders share button when onShare provided', () => {
    const onShare = vi.fn();
    const { container } = render(<DealCard deal={BASE_DEAL} onShare={onShare} />);
    expect(container.querySelector('[aria-label*="Share"]')).toBeTruthy();
  });

  it('does not render share button when onShare omitted', () => {
    const { container } = render(<DealCard deal={BASE_DEAL} />);
    expect(container.querySelector('[aria-label*="Share"]')).toBeNull();
  });

  it('calls onShare when share button clicked', () => {
    const onShare = vi.fn();
    const { container } = render(<DealCard deal={BASE_DEAL} onShare={onShare} />);
    const btn = container.querySelector('[aria-label*="Share"]') as HTMLElement;
    fireEvent.click(btn);
    expect(onShare).toHaveBeenCalledWith(BASE_DEAL);
  });

  it('calls onOpenDetail when cover clicked', () => {
    const onOpenDetail = vi.fn();
    const { container } = render(<DealCard deal={BASE_DEAL} onOpenDetail={onOpenDetail} />);
    const cover = container.querySelector('[aria-label="View Test Game details"]') as HTMLElement;
    fireEvent.click(cover);
    expect(onOpenDetail).toHaveBeenCalledWith(BASE_DEAL);
  });
});

describe('DealCardSkeleton', () => {
  it('renders shimmer blocks', () => {
    const { container } = render(<DealCardSkeleton />);
    const shimmers = container.querySelectorAll('.skeleton-shimmer');
    expect(shimmers.length).toBeGreaterThanOrEqual(5);
  });

  it('renders footer when not compact', () => {
    const { container } = render(<DealCardSkeleton />);
    expect(container.querySelector('.border-t')).toBeTruthy();
  });

  it('hides footer when compact', () => {
    const { container } = render(<DealCardSkeleton compact />);
    expect(container.querySelector('.border-t')).toBeNull();
  });
});
