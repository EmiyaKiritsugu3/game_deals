'use client';
import type { Deal } from '../../services/api';
import styles from '../HeroSection.module.css';

export function HeroNavigation({
  deals,
  currentIndex,
  goTo,
}: {
  deals: Deal[];
  currentIndex: number;
  goTo: (index: number) => void;
}) {
  return (
    <div className={styles.navigation}>
      {deals.map((deal) => (
        <button
          key={`${deal.dealID}-dot`}
          type="button"
          className={`${styles.dot} ${deals.indexOf(deal) === currentIndex ? styles.activeDot : ''}`}
          onClick={() => goTo(deals.indexOf(deal))}
          aria-label={`Go to slide ${deals.indexOf(deal) + 1}`}
        />
      ))}
    </div>
  );
}
