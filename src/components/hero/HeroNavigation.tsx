'use client';
import type { Deal } from '../../services/api';
import styles from '../HeroSection.module.css';

export function HeroNavigation({
  deals,
  currentIndex,
  goTo,
}: Readonly<{
  deals: Deal[];
  currentIndex: number;
  goTo: (index: number) => void;
}>) {
  return (
    <div className={styles.navigation}>
      {deals.map((deal, index) => (
        <button
          key={`${deal.dealID}-dot`}
          type="button"
          className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
          onClick={() => goTo(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
