import Image from 'next/image';
import Link from 'next/link';
import { type Deal, formatTimeAgo, getHighResImage, getStoreLogo, getStores } from '@/services/api';
import styles from './DealRow.module.css';
import DealsBadge from './DealsBadge';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';

function computeSavings(savings: string): number {
  return Math.round(Number.parseFloat(savings));
}

function isHistoricalLowDeal(savings: number): boolean {
  return savings > 85;
}

function isFreePrice(price: string): boolean {
  return Number.parseFloat(price) === 0;
}

function isEpicDealCheck(savings: number, isFree: boolean): boolean {
  return savings >= 75 || isFree;
}

function DealMeta({
  deal,
  storeName,
  storeLogo,
  timeAgo,
}: {
  deal: Deal;
  storeName: string;
  storeLogo: string | null;
  timeAgo: string;
}) {
  return (
    <div className={styles.mainInfo}>
      <h3 className={styles.title}>{deal.title}</h3>
      <div className={styles.meta}>
        {storeLogo ? (
          // biome-ignore lint/performance/noImgElement: store logos from affiliate CDN
          <img
            src={storeLogo}
            alt={storeName}
            title={storeName}
            className={styles.storeLogo}
            width={14}
            height={14}
          />
        ) : (
          <span className={styles.storeName}>{storeName}</span>
        )}
        <span className={styles.metaDivider}>·</span>
        <span className={styles.timeAgo}>{timeAgo}</span>
        {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
          <>
            <span className={styles.metaDivider}>·</span>
            <DealsBadge type="RATING" value={deal.steamRatingPercent} />
          </>
        )}
      </div>
    </div>
  );
}

function DealPrice({
  deal,
  savings,
  isFree,
  isHistoricalLow,
  isEpicDeal,
}: {
  deal: Deal;
  savings: number;
  isFree: boolean;
  isHistoricalLow: boolean;
  isEpicDeal: boolean;
}) {
  return (
    <div className={styles.priceContainer}>
      {isHistoricalLow && <DealsBadge type="HL" />}

      {isEpicDeal && <DealsBadge type="EPIC" compact />}

      {savings > 0 && !isFree && <div className={styles.discountBadge}>-{savings}%</div>}

      <div className={styles.prices}>
        {savings > 0 && !isFree && <span className={styles.normalPrice}>${deal.normalPrice}</span>}
        {isFree ? (
          <span className={styles.freePrice}>FREE</span>
        ) : (
          <span className={styles.salePrice}>${deal.salePrice}</span>
        )}
      </div>
    </div>
  );
}

interface DealRowProps {
  deal: Deal;
  rank?: number;
}

export default async function DealRow({ deal, rank: _rank }: DealRowProps) {
  const highResThumb = getHighResImage(deal.thumb);
  const savings = computeSavings(deal.savings);

  // Fetch stores map (Next.js deduplicates identical concurrent fetch calls)
  const storesMap = await getStores();
  const storeName = storesMap[deal.storeID] || `Store ${deal.storeID}`;
  const storeLogo = getStoreLogo(deal.storeID);

  // HL badge: savings > 85% is a strong proxy. Real HL needs per-game endpoint.
  const isHistoricalLow = isHistoricalLowDeal(savings);

  const timeAgo = formatTimeAgo(deal.lastChange);
  const isFree = isFreePrice(deal.salePrice);
  const isEpicDeal = isEpicDealCheck(savings, isFree);

  return (
    <Link href={`/game/${deal.gameID}`} className={styles.row}>
      <div className={styles.imageContainer}>
        <Image
          src={highResThumb}
          alt={deal.title}
          fill
          className={styles.image}
          sizes="100px"
          unoptimized
        />
        <div className={styles.topRightActions}>
          <PriceAlertBadge gameID={deal.gameID} />
          <HeartButton gameID={deal.gameID} className={styles.heartWrapper} />
        </div>
      </div>

      <div className={styles.content}>
        <DealMeta deal={deal} storeName={storeName} storeLogo={storeLogo} timeAgo={timeAgo} />
        <DealPrice
          deal={deal}
          savings={savings}
          isFree={isFree}
          isHistoricalLow={isHistoricalLow}
          isEpicDeal={isEpicDeal}
        />
      </div>
    </Link>
  );
}
