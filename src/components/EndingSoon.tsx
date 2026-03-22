import { getDeals } from '@/services/api';
import DealRow from './DealRow';
import Link from 'next/link';

export default async function EndingSoon() {
    const deals = await getDeals({ sortBy: 'Recent', pageSize: '8', onSale: '1' });

    if (deals.length === 0) return null;

    return (
        <div>
            <div className="mb-6 flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">⏰ Ending Soon</h2>
                    <p className="text-sm font-medium text-muted-foreground">Act fast — these deals won&apos;t last.</p>
                </div>
                <Link href="/search?sortBy=Recent" className="shrink-0 text-sm font-bold text-primary transition-colors hover:text-emerald-400">SEE ALL ▶</Link>
            </div>
            <div className="flex flex-col gap-4">
                {deals.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                ))}
            </div>
        </div>
    );
}
