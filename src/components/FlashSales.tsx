import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import type { Deal } from '@/services/api';

interface FlashSalesProps {
  readonly deals: Deal[];
}

export default function FlashSales({ deals }: FlashSalesProps) {
  if (!deals || deals.length === 0) return null;
  return (
    <PopularDealsGrid
      deals={deals.slice(0, 8).map((d) => normaliseDeal(d))}
      title="⚡ Flash Deals"
      description="Limited time offers"
    />
  );
}
