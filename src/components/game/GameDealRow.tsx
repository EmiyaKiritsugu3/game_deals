import { buildDealRowProps, buildOutUrl } from '@/lib/game-data';
import { getDrmType, getRegionTag, getStoreLogo } from '@/services/api';
import type { GameDeal } from '@/types/game';
import styles from './GameDealRow.module.css';

export interface GameDealRowProps {
  deal: GameDeal;
  isBest: boolean;
  cheapestEver: number;
  gameTitle: string;
  stores: Record<string, string>;
  showRegion?: boolean;
  showEpicBadge?: boolean;
}

export default function GameDealRow({
  deal,
  isBest,
  cheapestEver,
  gameTitle,
  stores,
  showRegion = false,
  showEpicBadge = false,
}: GameDealRowProps) {
  const { savings, isDealAtHL, isFree, isEpicDeal } = buildDealRowProps(deal, cheapestEver);

  const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
  const logo = getStoreLogo(deal.storeID);
  const drm = getDrmType(deal.storeID);

  const storeLogoEl = logo ? (
    // biome-ignore lint/performance/noImgElement: store logos from affiliate CDN
    <img src={logo} alt={storeName} className={styles.storeLogo} width={18} height={18} />
  ) : (
    <div className={styles.storeLogoPlaceholder} />
  );

  return (
    <a
      key={deal.dealID}
      href={buildOutUrl(deal, gameTitle, storeName)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.dealRow} ${isBest ? styles.dealRowBest : ''}`}
    >
      <div className={styles.storeInfo}>
        {storeLogoEl}
        <span className={styles.storeName}>{storeName}</span>
        {isBest && <span className={styles.bestTag}>BEST</span>}
        {showEpicBadge && isEpicDeal && <span className="epicDealBadge">🔥 EPIC</span>}
        <span className="drmBadge">
          {drm.icon} {drm.label}
        </span>
        {showRegion && getRegionTag(deal.storeID) && (
          <span className="regionBadge">{getRegionTag(deal.storeID)}</span>
        )}
      </div>

      <div className={styles.dealPriceInfo}>
        {isDealAtHL && <span className={styles.hlBadge}>HL</span>}
        {savings > 0 && !isFree && <div className={styles.savingsBadge}>-{savings}%</div>}
        <div className={styles.prices}>
          {savings > 0 && !isFree && <span className={styles.retail}>${deal.retailPrice}</span>}
          {isFree ? (
            <span className={styles.freePrice}>FREE</span>
          ) : (
            <span className={styles.price}>${deal.price}</span>
          )}
        </div>
      </div>
    </a>
  );
}
