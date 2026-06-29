/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock child components
vi.mock('@/components/game/deal-card', () => ({
  DealCard: ({ deal, index, variantCount, onOpenDetail, onShare }: Record<string, unknown>) => (
    <div
      data-testid="deal-card"
      data-deal-id={(deal as { dealID: string }).dealID}
      data-index={index}
      data-variant-count={variantCount}
    >
      <button
        type="button"
        data-testid="open-detail"
        onClick={() => (onOpenDetail as (d: unknown) => void)?.(deal)}
      >
        Detail
      </button>
      <button
        type="button"
        data-testid="share"
        onClick={() => (onShare as (d: unknown) => void)?.(deal)}
      >
        Share
      </button>
    </div>
  ),
  DealCardSkeleton: ({ compact }: { compact?: boolean }) => (
    <div data-testid="deal-card-skeleton" data-compact={String(compact)} />
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: (props: Record<string, unknown>) => <button type="button" {...props} />,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Gamepad2: () => <div data-testid="icon-gamepad" />,
  Grid2x2: () => <div data-testid="icon-grid" />,
  Inbox: () => <div data-testid="icon-inbox" />,
  Rows3: () => <div data-testid="icon-rows" />,
}));

// Store mock
const mockStore = vi.hoisted(() => ({
  density: 'comfortable' as 'comfortable' | 'compact',
  setDensity: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('@/store/density', () => ({
  useDensity: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

import type { DealWithStore } from '@/lib/deal-utils';
import { DealGrid, type DealGridItem } from './deal-grid';

const makeDeal = (id: string, overrides?: Record<string, unknown>) => ({
  dealID: id,
  title: `Game ${id}`,
  salePrice: '19.99',
  normalPrice: '49.99',
  isOnSale: '1',
  savings: '60.00',
  storeID: '1',
  gameID: id,
  metacriticScore: '85',
  steamRatingText: 'Very Positive',
  steamRatingPercent: '90',
  steamRatingCount: '1000',
  steamAppID: '12345',
  releaseDate: 1600000000,
  lastChange: 1600000000,
  dealRating: '8.5',
  thumb: `https://example.com/${id}.jpg`,
  internalName: `game-${id}`,
  metacriticLink: `/game/pc/game-${id}`,
  ...overrides,
});

describe('DealGrid', () => {
  beforeEach(() => {
    mockStore.density = 'comfortable';
  });

  describe('loading state', () => {
    it('renders 8 skeletons when loading', () => {
      render(<DealGrid deals={[]} loading error={false} />);
      expect(screen.getAllByTestId('deal-card-skeleton')).toHaveLength(8);
    });

    it('renders skeletons with compact=false when density is comfortable', () => {
      render(<DealGrid deals={[]} loading error={false} />);
      for (const s of screen.getAllByTestId('deal-card-skeleton')) {
        expect(s).toHaveAttribute('data-compact', 'false');
      }
    });

    it('renders skeletons with compact=true when density is compact', () => {
      mockStore.density = 'compact';
      render(<DealGrid deals={[]} loading error={false} />);
      for (const s of screen.getAllByTestId('deal-card-skeleton')) {
        expect(s).toHaveAttribute('data-compact', 'true');
      }
    });
  });

  describe('error state', () => {
    it('shows error message when error is true and no deals', () => {
      render(<DealGrid deals={[]} loading={false} error />);
      expect(screen.getByText("Couldn't reach the deals feed")).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders deals when error is true but deals exist (cached)', () => {
      const deals = [makeDeal('1')];
      render(<DealGrid deals={deals as unknown as DealWithStore[]} loading={false} error />);
      expect(screen.getByTestId('deal-card')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-inbox')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when no deals and not loading', () => {
      render(<DealGrid deals={[]} loading={false} error={false} />);
      expect(screen.getByText('No deals match your filters')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('deals rendering', () => {
    it('renders a deal card per item', () => {
      const deals = [makeDeal('1'), makeDeal('2')];
      render(
        <DealGrid deals={deals as unknown as DealWithStore[]} loading={false} error={false} />
      );
      expect(screen.getAllByTestId('deal-card')).toHaveLength(2);
    });

    it('passes deal prop to each card', () => {
      const deals = [makeDeal('abc')];
      render(
        <DealGrid deals={deals as unknown as DealWithStore[]} loading={false} error={false} />
      );
      expect(screen.getByTestId('deal-card')).toHaveAttribute('data-deal-id', 'abc');
    });

    it('passes index prop to each card', () => {
      const deals = [makeDeal('x'), makeDeal('y')];
      render(
        <DealGrid deals={deals as unknown as DealWithStore[]} loading={false} error={false} />
      );
      const cards = screen.getAllByTestId('deal-card');
      expect(cards[0]).toHaveAttribute('data-index', '0');
      expect(cards[1]).toHaveAttribute('data-index', '1');
    });

    it('passes variantCount=1 for flat array', () => {
      const deals = [makeDeal('1')];
      render(
        <DealGrid deals={deals as unknown as DealWithStore[]} loading={false} error={false} />
      );
      expect(screen.getByTestId('deal-card')).toHaveAttribute('data-variant-count', '1');
    });

    it('accepts DealGridItem array with variantCount', () => {
      const items = [{ deal: makeDeal('1'), variantCount: 3 }];
      render(<DealGrid deals={items as unknown as DealGridItem[]} loading={false} error={false} />);
      expect(screen.getByTestId('deal-card')).toHaveAttribute('data-variant-count', '3');
    });

    it('calls onOpenDetail when detail button clicked', () => {
      const onOpenDetail = vi.fn();
      const deals = [makeDeal('42')];
      render(
        <DealGrid
          deals={deals as unknown as DealWithStore[]}
          loading={false}
          error={false}
          onOpenDetail={onOpenDetail}
        />
      );
      fireEvent.click(screen.getByTestId('open-detail'));
      expect(onOpenDetail).toHaveBeenCalledWith(deals[0]);
    });

    it('calls onShare when share button clicked', () => {
      const onShare = vi.fn();
      const deals = [makeDeal('7')];
      render(
        <DealGrid
          deals={deals as unknown as DealWithStore[]}
          loading={false}
          error={false}
          onShare={onShare}
        />
      );
      fireEvent.click(screen.getByTestId('share'));
      expect(onShare).toHaveBeenCalledWith(deals[0]);
    });
  });

  describe('density toggle', () => {
    it('renders density toggle button', () => {
      render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
        />
      );
      expect(screen.getByLabelText('Switch to compact layout')).toBeInTheDocument();
    });

    it('calls onDensityChange when prop provided', () => {
      const onDensityChange = vi.fn();
      render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
          density="comfortable"
          onDensityChange={onDensityChange}
        />
      );
      fireEvent.click(screen.getByLabelText('Switch to compact layout'));
      expect(onDensityChange).toHaveBeenCalledWith('compact');
    });

    it('calls store toggle when no onDensityChange prop', () => {
      render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
        />
      );
      fireEvent.click(screen.getByLabelText('Switch to compact layout'));
      expect(mockStore.toggle).toHaveBeenCalledOnce();
    });

    it('shows compact icon when density is compact', () => {
      mockStore.density = 'compact';
      render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
        />
      );
      expect(screen.getByTestId('icon-rows')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to comfortable layout')).toBeInTheDocument();
    });

    it('shows comfortable icon when density is comfortable', () => {
      render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
        />
      );
      expect(screen.getByTestId('icon-grid')).toBeInTheDocument();
    });

    it('applies compact grid classes via prop override', () => {
      const { container } = render(
        <DealGrid
          deals={[[makeDeal('1')]] as unknown as DealWithStore[]}
          loading={false}
          error={false}
          density="compact"
        />
      );
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });
});
