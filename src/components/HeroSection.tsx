'use client';
import { useCarousel } from '@/hooks/useCarousel';
import type { Deal } from '../services/api';
import styles from './HeroSection.module.css';
import { HeroNavigation } from './hero/HeroNavigation';
import { HeroSlide } from './hero/HeroSlide';
import { MatrixBackground } from './hero/MatrixBackground';

export default function HeroSection({ deals }: Readonly<{ deals: Deal[] }>) {
  const { currentIndex, goTo } = useCarousel(deals.length);
  if (!deals.length) return null;

  return (
    <section className={styles.hero}>
      <MatrixBackground deals={deals} />
      {deals.map((deal, idx) => (
        <HeroSlide key={deal.dealID} deal={deal} isActive={idx === currentIndex} index={idx} />
      ))}
      {deals.length > 1 && <HeroNavigation deals={deals} currentIndex={currentIndex} goTo={goTo} />}
    </section>
  );
}
