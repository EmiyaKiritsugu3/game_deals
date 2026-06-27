'use client';
import type { Deal } from '../../services/api';

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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
      {deals.map((deal, index) => (
        <button
          key={`${deal.dealID}-dot`}
          type="button"
          className={`w-8 h-1 rounded-full transition-all duration-300 hover:bg-muted-foreground/70 ${
            index === currentIndex ? 'bg-primary w-12' : 'bg-muted-foreground/30'
          }`}
          onClick={() => goTo(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
