import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { getDeals } from '@/services/api';

export default async function EndingSoon() {
  const deals = await getDeals({ sortBy: 'Recent', pageSize: '8', onSale: '1' });

  if (deals.length === 0) return null;

  return (
    <PopularDealsGrid
      deals={deals.map((d) => normaliseDeal(d))}
      title="⏰ Ending Soon"
      description="Act fast — these deals won't last."
    />
  );
}
