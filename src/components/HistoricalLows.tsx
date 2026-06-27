import { getDeals, getGamesBatch } from '@/services/api';
import DealRow from './DealRow';
import DealsBadge from './DealsBadge';

export default async function HistoricalLows() {
  // 1. Fetch diverse candidates
  const [broadPool, bestDeals, popular] = await Promise.all([
    getDeals({ sortBy: 'Deal Rating', pageSize: '50', onSale: '1' }),
    getDeals({ sortBy: 'Savings', pageSize: '10' }),
    getDeals({ pageSize: '5' }),
  ]);

  // 2. Consolidate and de-duplicate candidates
  const hlSource = [...broadPool, ...bestDeals, ...popular];
  const uniqueCandidatesMap = new Map<string, (typeof hlSource)[number]>();
  hlSource.forEach((d) => {
    if (!uniqueCandidatesMap.has(d.gameID)) uniqueCandidatesMap.set(d.gameID, d);
  });
  const hlCandidates = Array.from(uniqueCandidatesMap.values()).slice(0, 50);

  // 3. Strict verification against actual 'cheapestPriceEver'
  // ⚡ Bolt: Batch fetch to avoid N+1 problem. Previously fired up to 50 individual requests.
  const candidateIds = hlCandidates.map((c) => c.gameID);
  const batchedGames = await getGamesBatch(candidateIds);

  const verifiedHLs = hlCandidates.map((deal) => {
    const gameInfo = batchedGames[deal.gameID];
    if (!gameInfo?.cheapestPriceEver) return null;

    const currentPrice = Number.parseFloat(deal.salePrice);
    const historicalLow = Number.parseFloat(gameInfo.cheapestPriceEver.price);

    // Strict HL check: current price must be within 1% of the historical low
    return currentPrice <= historicalLow * 1.01 ? deal : null;
  });

  const hlDeals = verifiedHLs
    .filter((d): d is (typeof hlCandidates)[number] => d !== null)
    .slice(0, 8);

  if (hlDeals.length === 0) return null;

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              <DealsBadge type="HL" className="text-[0.8rem] py-[0.15rem] px-2 mr-2 align-middle" />{' '}
              Historical Lows
            </h2>
            <p className="text-muted-foreground text-sm">
              Prices at or near their all-time lowest.
            </p>
          </div>
          <a
            href="/search?sortBy=Savings"
            className="text-[0.75rem] font-semibold text-primary no-underline whitespace-nowrap tracking-wider shrink-0 hover:opacity-75 transition-opacity duration-150"
          >
            SEE ALL ▶
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {hlDeals.map((deal) => (
          <DealRow key={deal.dealID} deal={deal} />
        ))}
      </div>
    </div>
  );
}
