'use client';

import { useShareWishlist } from '@/hooks/useShareWishlist';
import type { SavedGame } from '@/hooks/useSortedGames';

type SortMode = 'discount' | 'price' | 'name';

interface WishlistStatsProps {
  readonly totalValue: string;
  readonly bestDiscountGame: SavedGame | null;
  readonly sortMode: SortMode;
  readonly onSortModeChange: (mode: SortMode) => void;
  readonly wishlist: string[];
}

export default function WishlistStats({
  totalValue,
  bestDiscountGame,
  sortMode,
  onSortModeChange,
  wishlist,
}: WishlistStatsProps) {
  const { copied, share } = useShareWishlist(wishlist);

  return (
    <div className="flex items-center justify-between bg-card px-6 py-4 rounded-lg border border-border mb-2 flex-wrap gap-4 max-md:flex-col max-md:items-stretch">
      <div className="flex gap-8 max-md:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Portfolio Value
          </span>
          <span className="text-xl font-extrabold text-primary">${totalValue}</span>
        </div>
        {bestDiscountGame && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Best Discount
            </span>
            <span className="text-xl font-extrabold text-primary">
              -{bestDiscountGame.savings}%
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground">Sort by:</span>
          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as SortMode)}
            className="bg-background border border-border text-foreground px-4 py-2 rounded-lg text-sm font-inherit cursor-pointer outline-none focus:border-primary"
          >
            <option value="discount">Best Discount</option>
            <option value="price">Lowest Price</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(260,70%,60%)] text-white font-bold text-xs border-none cursor-pointer whitespace-nowrap font-inherit hover:-translate-y-0.5 hover:shadow-[0_4px_18px_rgba(100,100,255,0.35)] active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          onClick={share}
        >
          {copied ? '✅ Link copied!' : '🔗 Share Wishlist'}
        </button>
      </div>
    </div>
  );
}
