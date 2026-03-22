import { getDeals, getGame } from '@/services/api';
import DealRow from './DealRow';
import DealsBadge from './DealsBadge';
import Link from 'next/link';

export default async function HistoricalLows() {
    // 1. Fetch diverse candidates
    const [broadPool, bestDeals, popular] = await Promise.all([
        getDeals({ sortBy: 'Deal Rating', pageSize: '50', onSale: '1' }),
        getDeals({ sortBy: 'Savings', pageSize: '10' }),
        getDeals({ pageSize: '5' })
    ]);

    // 2. Consolidate and de-duplicate candidates
    const hlSource = [...broadPool, ...bestDeals, ...popular];
    const uniqueCandidatesMap = new Map();
    hlSource.forEach(d => {
        if (!uniqueCandidatesMap.has(d.gameID)) uniqueCandidatesMap.set(d.gameID, d);
    });
    const hlCandidates = Array.from(uniqueCandidatesMap.values()).slice(0, 50);

    // 3. Strict verification against actual 'cheapestPriceEver'
    const verifiedHLs = await Promise.all(
        hlCandidates.map(async (deal) => {
            try {
                const gameInfo = await getGame(deal.gameID);
                if (!gameInfo || !gameInfo.cheapestPriceEver) return null;

                const currentPrice = parseFloat(deal.salePrice);
                const historicalLow = parseFloat(gameInfo.cheapestPriceEver.price);

                // Strict HL check: current price must be within 1% of the historical low
                return currentPrice <= historicalLow * 1.01 ? deal : null;
            } catch {
                return null;
            }
        })
    );

    const hlDeals = verifiedHLs.filter((d): d is NonNullable<typeof d> => d !== null).slice(0, 8);

    if (hlDeals.length === 0) return null;

    return (
        <div>
            <div className="mb-6 flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
                <div>
                    <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                        <DealsBadge type="HL" className="scale-125 shadow-[0_0_15px_hsl(var(--accent)/0.5)]" />
                        Historical Lows
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">Prices at or near their all-time lowest.</p>
                </div>
                <Link href="/search?sortBy=Savings" className="shrink-0 text-sm font-bold text-primary transition-colors hover:text-emerald-400">SEE ALL ▶</Link>
            </div>
            <div className="flex flex-col gap-4">
                {hlDeals.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                ))}
            </div>
        </div>
    );
}
