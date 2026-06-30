import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import type { Deal } from '@/services/api';

interface HotDealsSectionProps {
  readonly deals: Deal[];
  readonly limit?: number;
}

export default async function HotDealsSection({ deals, limit = 12 }: HotDealsSectionProps) {
  const sorted = [...deals]
    .filter((d) => d.dealRating && !Number.isNaN(Number.parseFloat(d.dealRating)))
    .sort((a, b) => Number.parseFloat(b.dealRating) - Number.parseFloat(a.dealRating))
    .slice(0, limit);

  if (sorted.length === 0) return null;

  return (
    <PopularDealsGrid
      deals={sorted.map((d) => normaliseDeal(d))}
      title="Hottest Deals"
      description="Top-rated deals sorted by deal rating"
    />
  );
}
