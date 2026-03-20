import Image from 'next/image';
import Link from 'next/link';
import { Deal, getHighResImage, getStores, getStoreLogo, formatTimeAgo } from '@/services/api';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';
import styles from './DealRow.module.css';

interface DealRowProps {
    deal: Deal;
    rank?: number;
}

export default async function DealRow({ deal, rank }: DealRowProps) {
    const highResThumb = getHighResImage(deal.thumb);
    const savings = Math.round(parseFloat(deal.savings));

    // Fetch stores map (Next.js deduplicates identical concurrent fetch calls)
    const storesMap = await getStores();
    const storeName = storesMap[deal.storeID] || `Store ${deal.storeID}`;
    const storeLogo = getStoreLogo(deal.storeID);

    // HL badge: savings > 85% is a strong proxy. Real HL needs per-game endpoint.
    const isHistoricalLow = savings > 85;

    const timeAgo = formatTimeAgo(deal.lastChange);
    const salePrice = parseFloat(deal.salePrice);
    const isFree = salePrice === 0;
    const isEpicDeal = savings >= 75 || isFree;

    return (
        <Link href={`/game/${deal.gameID}`} className={styles.row}>
            <div className={styles.imageContainer}>
                <Image
                    src={highResThumb}
                    alt={deal.title}
                    fill
                    className={styles.image}
                    sizes="100px"
                />
                <div className={styles.topRightActions}>
                    <PriceAlertBadge gameID={deal.gameID} />
                    <HeartButton gameID={deal.gameID} className={styles.heartWrapper} />
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.mainInfo}>
                    <h3 className={styles.title}>{deal.title}</h3>
                    <div className={styles.meta}>
                        {storeLogo ? (
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
                    </div>
                </div>

                <div className={styles.priceContainer}>
                    {isHistoricalLow && (
                        <span className={styles.hlBadge} title="Historical Low Price">HL</span>
                    )}

                    {isEpicDeal && (
                        <span className="epicDealBadge">🔥 EPIC</span>
                    )}

                    {savings > 0 && !isFree && (
                        <div className={styles.discountBadge}>-{savings}%</div>
                    )}

                    <div className={styles.prices}>
                        {savings > 0 && !isFree && (
                            <span className={styles.normalPrice}>${deal.normalPrice}</span>
                        )}
                        {isFree ? (
                            <span className={styles.freePrice}>FREE</span>
                        ) : (
                            <span className={styles.salePrice}>${deal.salePrice}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
