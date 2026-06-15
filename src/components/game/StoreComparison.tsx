import { sortDealsByPrice } from '@/lib/game-data';
import type { GameDeal } from '@/types/game';
import GameDealRow from './GameDealRow';
import styles from './StoreComparison.module.css';

export interface StoreComparisonProps {
  officialDeals: GameDeal[];
  keyshopDeals: GameDeal[];
  cheapestEver: number;
  gameTitle: string;
  stores: Record<string, string>;
  showEpicBadge?: boolean;
  showRegion?: boolean;
}

export default function StoreComparison({
  officialDeals,
  keyshopDeals,
  cheapestEver,
  gameTitle,
  stores,
  showEpicBadge,
  showRegion,
}: StoreComparisonProps) {
  const sortedOfficial = sortDealsByPrice(officialDeals);
  const sortedKeyshop = sortDealsByPrice(keyshopDeals);

  const officialBest =
    sortedOfficial.length > 0 ? Number.parseFloat(sortedOfficial[0].price) : null;
  const keyshopBest = sortedKeyshop.length > 0 ? Number.parseFloat(sortedKeyshop[0].price) : null;

  return (
    <div className={styles.storeComparison}>
      {sortedOfficial.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Official Stores</h2>
          <div className={styles.dealsList}>
            {sortedOfficial.map((deal) => (
              <GameDealRow
                key={deal.dealID}
                deal={deal}
                isBest={Number.parseFloat(deal.price) === officialBest}
                cheapestEver={cheapestEver}
                gameTitle={gameTitle}
                stores={stores}
                showEpicBadge={showEpicBadge}
                showRegion={showRegion}
              />
            ))}
          </div>
        </>
      )}

      {sortedKeyshop.length > 0 && (
        <>
          <h2 className={`${styles.sectionTitle} ${styles.keyshopTitle}`}>Keyshops</h2>
          <div className={styles.dealsList}>
            {sortedKeyshop.map((deal) => (
              <GameDealRow
                key={deal.dealID}
                deal={deal}
                isBest={Number.parseFloat(deal.price) === keyshopBest}
                cheapestEver={cheapestEver}
                gameTitle={gameTitle}
                stores={stores}
                showEpicBadge={showEpicBadge}
                showRegion={showRegion}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
