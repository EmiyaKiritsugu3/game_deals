import { getDeals, getGame } from '@/services/api';
import DealRow from './DealRow';
import styles from '../app/page.module.css';

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
            } catch (e) {
                return null;
            }
        })
    );

    const hlDeals = verifiedHLs.filter((d): d is any => d !== null).slice(0, 8);

    if (hlDeals.length === 0) return null;

    return (
        <div className={styles.listSection}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderRow}>
                    <div>
                        <h2><span className={styles.hlAccent}>HL</span> Historical Lows</h2>
                        <p>Prices at or near their all-time lowest.</p>
                    </div>
                    <a href="/search?sortBy=Savings" className={styles.seeAll}>SEE ALL ▶</a>
                </div>
            </div>
            <div className={styles.listCol}>
                {hlDeals.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                ))}
            </div>
        </div>
    );
}
