import { getDeals } from '@/services/api';
import DealRow from './DealRow';

export default async function EndingSoon() {
  const deals = await getDeals({ sortBy: 'Recent', pageSize: '8', onSale: '1' });

  if (deals.length === 0) return null;

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              {'⏰'} Ending Soon
            </h2>
            <p className="text-muted-foreground text-sm">Act fast — these deals won&apos;t last.</p>
          </div>
          <a
            href="/search?sortBy=Recent"
            className="text-[0.75rem] font-semibold text-primary no-underline whitespace-nowrap tracking-wider shrink-0 hover:opacity-75 transition-opacity duration-150"
          >
            SEE ALL {'▶'}
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <DealRow key={deal.dealID} deal={deal} />
        ))}
      </div>
    </div>
  );
}
