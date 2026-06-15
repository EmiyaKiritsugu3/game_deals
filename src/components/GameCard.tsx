import Image from 'next/image';
import Link from 'next/link';
import { type Deal, getHighResImage, getStores } from '../services/api';
import AddToListButton from './AddToListButton';
import DealsBadge from './DealsBadge';
import styles from './GameCard.module.css';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';

export function computeSavings(savings: string): number {
  return Math.round(Number.parseFloat(savings));
}

export function isPriceFree(price: string): boolean {
  return Number.parseFloat(price) === 0;
}

export function isEpicDealCheck(savings: number, isFree: boolean): boolean {
  return savings >= 85 || isFree;
}

export function isHistoricalLowCheck(savings: number): boolean {
  return savings >= 90;
}

export default async function GameCard({ deal }: { deal: Deal }) {
  const stores = await getStores();
  const store = stores[deal.storeID];
  const highResThumb = getHighResImage(deal.thumb);
  const savings = computeSavings(deal.savings);
  const isFree = isPriceFree(deal.salePrice);
  const isEpicDeal = isEpicDealCheck(savings, isFree);
  const isHistoricalLow = isHistoricalLowCheck(savings);

  return (
    <div className={styles.card}>
      <Link href={`/game/${deal.gameID}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <Image
            src={highResThumb}
            alt={deal.title}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className={styles.topRightActions}>
            <PriceAlertBadge gameID={deal.gameID} />
            <HeartButton gameID={deal.gameID} className={styles.heartWrapper} />
          </div>
          <div className={styles.badgesOverlay}>
            <AddToListButton gameId={deal.gameID} />
            {isEpicDeal && <DealsBadge type="EPIC" />}
            {isHistoricalLow && <DealsBadge type="HL" />}
          </div>
          {savings > 0 && !isFree && <div className={styles.savingsBadge}>-{savings}%</div>}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title} title={deal.title}>
            {deal.title}
          </h3>

          <div className={styles.priceContainer}>
            {savings > 0 && <span className={styles.normalPrice}>${deal.normalPrice}</span>}
            <span className={styles.salePrice}>${deal.salePrice}</span>
          </div>

          <div className={styles.meta}>
            <span className={styles.storeBadge}>{store || 'Store'}</span>
            {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
              <span className={styles.ratingBadge}>★ {deal.steamRatingPercent}%</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
