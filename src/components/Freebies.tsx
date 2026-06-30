import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import type { Deal } from '@/services/api';

interface FreebiesProps {
  readonly deals: Deal[];
}

export default function Freebies({ deals }: FreebiesProps) {
  if (!deals || deals.length === 0) return null;
  return (
    <PopularDealsGrid
      deals={deals.slice(0, 6).map((d) => normaliseDeal(d))}
      title="🎁 FREE GAMES! (100% OFF)"
      description="Claim these free games now"
    />
  );
}
