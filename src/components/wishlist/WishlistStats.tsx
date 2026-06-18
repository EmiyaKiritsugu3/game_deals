'use client';

import { useShareWishlist } from '@/hooks/useShareWishlist';
import type { SavedGame } from '@/hooks/useSortedGames';
import styles from './WishlistStats.module.css';

interface WishlistStatsProps {
  totalValue: string;
  bestDiscountGame: SavedGame | null;
  sortMode: 'discount' | 'price' | 'name';
  onSortModeChange: (mode: 'discount' | 'price' | 'name') => void;
  wishlist: string[];
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
    <div className={styles.dashboardPanel}>
      <div className={styles.statsPanel}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Portfolio Value</span>
          <span className={styles.statValue}>${totalValue}</span>
        </div>
        {bestDiscountGame && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Best Discount</span>
            <span className={styles.statValue}>-{bestDiscountGame.savings}%</span>
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
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort by:</span>
          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as 'name' | 'price' | 'discount')}
            className={styles.sortSelect}
          >
            <option value="discount">Best Discount</option>
            <option value="price">Lowest Price</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        <button type="button" className={styles.shareButton} onClick={share}>
          {copied ? '✅ Link copied!' : '🔗 Share Wishlist'}
        </button>
      </div>
    </div>
  );
}
