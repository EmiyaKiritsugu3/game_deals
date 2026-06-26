import Link from 'next/link';
import GameCard from '@/components/GameCard';
import { AnimatedDiv } from '@/components/motion/AnimatedDiv';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Deal } from '@/services/api';

interface HotDealsSectionProps {
  readonly deals: Deal[];
  readonly limit?: number;
}

export default async function HotDealsSection({ deals, limit = 12 }: HotDealsSectionProps) {
  // ponytail: filter NaN before sort — CheapShark can return non-numeric dealRating
  const sorted = [...deals]
    .filter((d) => d.dealRating && !Number.isNaN(Number.parseFloat(d.dealRating)))
    .sort((a, b) => Number.parseFloat(b.dealRating) - Number.parseFloat(a.dealRating))
    .slice(0, limit);

  if (sorted.length === 0) return null;

  return (
    <AnimatedDiv className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hottest Deals</h2>
          <p className="text-sm text-muted-foreground">Top-rated deals sorted by deal rating</p>
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
          <AnimatedDiv key={deal.dealID} delay={i * 0.05} hover>
            <div className="w-[280px] shrink-0">
              <GameCard deal={deal} />
            </div>
          </AnimatedDiv>
        ))}
      </div>
    </AnimatedDiv>
  );
}
