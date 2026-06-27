'use client';
import { useCarousel } from '@/hooks/useCarousel';
import type { Deal } from '../services/api';
import { HeroNavigation } from './hero/HeroNavigation';
import { HeroSlide } from './hero/HeroSlide';
import { MatrixBackground } from './hero/MatrixBackground';

export default function HeroSection({ deals }: Readonly<{ deals: Deal[] }>) {
  const { currentIndex, goTo } = useCarousel(deals.length);
  if (!deals.length) return null;

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden mb-12 bg-background">
      <MatrixBackground deals={deals} />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/100 from-[5%] to-transparent to-[70%] z-[5] pointer-events-none"
        aria-hidden="true"
      />
      {deals.map((deal, idx) => (
        <HeroSlide key={deal.dealID} deal={deal} isActive={idx === currentIndex} index={idx} />
      ))}
      {deals.length > 1 && <HeroNavigation deals={deals} currentIndex={currentIndex} goTo={goTo} />}
    </section>
  );
}
