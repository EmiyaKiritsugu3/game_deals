'use client';

import type { SavedGame } from '@/hooks/useSortedGames';
import styles from './WishlistHero.module.css';

interface WishlistHeroProps {
  bestDiscountGame: SavedGame | null;
}

export default function WishlistHero({ bestDiscountGame }: WishlistHeroProps) {
  return (
    <div className={styles.heroHeader}>
      {bestDiscountGame?.thumb && (
        <div
          className={styles.heroBackground}
          style={{ backgroundImage: `url(${bestDiscountGame.thumb})` }}
        />
      )}
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1 className={styles.title}>My Dashboard ❤️</h1>
        <p className={styles.subtitle}>Manage your favorite games and alerts.</p>
      </div>
    </div>
  );
}
