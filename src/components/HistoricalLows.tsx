import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { getDeals } from '@/services/api';

export default async function HistoricalLows() {
  const [bestDeals, popular] = await Promise.all([
    getDeals({ sortBy: 'Savings', pageSize: '10' }),
    getDeals({ pageSize: '5' }),
  ]);

  const deals = [...bestDeals, ...popular];

  if (deals.length === 0) return null;

  return (
    <PopularDealsGrid
      deals={deals.map((d) => normaliseDeal(d))}
      title="Historical Lows"
      description="Games at or near their cheapest price ever"
    />
  );
}
