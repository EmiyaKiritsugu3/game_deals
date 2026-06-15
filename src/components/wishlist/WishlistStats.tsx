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
          <span className={styles.statLabel}>Valor da Carteira</span>
          <span className={styles.statValue}>${totalValue}</span>
        </div>
        {bestDiscountGame && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Maior Desconto</span>
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
          <span className={styles.sortLabel}>Ordenar por:</span>
          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as 'name' | 'price' | 'discount')}
            className={styles.sortSelect}
          >
            <option value="discount">Maior Desconto</option>
            <option value="price">Menor Preço</option>
            <option value="name">Ordem Alfabética</option>
          </select>
        </div>

        <button type="button" className={styles.shareButton} onClick={share}>
          {copied ? '✅ Link copiado!' : '🔗 Compartilhar Wishlist'}
        </button>
      </div>
    </div>
  );
}
