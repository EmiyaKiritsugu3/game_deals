import Link from 'next/link';
import { type Deal } from '@/services/api';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import GameCard from '@/components/GameCard';
import { RevealSection } from '@/components/motion/RevealSection';
import { AnimatedGameCardWrapper } from '@/components/motion/AnimatedGameCardWrapper';

interface HotDealsSectionProps {
  readonly deals: Deal[];
  readonly limit?: number;
}

export default async function HotDealsSection({
  deals,
  limit = 12,
}: HotDealsSectionProps) {
  const sorted = [...deals]
    .sort((a, b) => Number.parseFloat(b.dealRating) - Number.parseFloat(a.dealRating))
    .slice(0, limit);

  if (sorted.length === 0) return null;

  return (
    <RevealSection className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hottest Deals</h2>
          <p className="text-sm text-muted-foreground">
            Top-rated deals sorted by deal rating
          </p>
        </div>
        <Link
          href="/search?sort=dealRating"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-sm font-semibold')}
        >
          See All &rarr;
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {sorted.map((deal, i) => (
          <AnimatedGameCardWrapper key={deal.dealID} delay={i * 0.05}>
            <div className="w-[280px] shrink-0">
              <GameCard deal={deal} />
            </div>
          </AnimatedGameCardWrapper>
        ))}
      </div>
    </RevealSection>
  );
}
