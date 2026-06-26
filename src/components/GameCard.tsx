import Image from 'next/image';
import Link from 'next/link';
import {
  computeSavings,
  isEpicDealCheck,
  isHistoricalLowCheck,
  isPriceFree,
} from '@/utils/pricing';
import { type Deal, getHighResImage, getStoreLogo, getStores } from '../services/api';
import AddToListButton from './AddToListButton';
import DealsBadge from './DealsBadge';
import styles from './GameCard.module.css';
import StoreIcon from './game/StoreIcon';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';

function PriceBlock({
  savings,
  normalPrice,
  salePrice,
}: Readonly<{
  savings: number;
  normalPrice: string;
  salePrice: string;
}>) {
  return (
    <div className={styles.priceContainer}>
      {savings > 0 && <span className={styles.normalPrice}>${normalPrice}</span>}
      <span className={styles.salePrice}>${salePrice}</span>
    </div>
  );
}

export default async function GameCard({ deal }: Readonly<{ deal: Deal }>) {
  const stores = await getStores();
  const store = stores[deal.storeID];
  const storeLogo = getStoreLogo(deal.storeID);
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
            unoptimized
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

          <PriceBlock savings={savings} normalPrice={deal.normalPrice} salePrice={deal.salePrice} />

          <div className={styles.meta}>
            <span className={styles.storeBadge}>
              {store && storeLogo && <StoreIcon src={storeLogo} alt={store} />}
              {store || 'Store'}
            </span>
            {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
              <span className={styles.ratingBadge}>★ {deal.steamRatingPercent}%</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
