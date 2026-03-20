import Image from 'next/image';
import Link from 'next/link';
import { Deal, getStores, getHighResImage } from '../services/api';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';
import styles from './GameCard.module.css';

export default async function GameCard({ deal }: { deal: Deal }) {
    const savings = Math.round(parseFloat(deal.savings));
    const stores = await getStores();
    const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
    const highResThumb = getHighResImage(deal.thumb);
    const isFree = parseFloat(deal.salePrice) === 0;
    const isEpicDeal = savings >= 75 || isFree;

    return (
        <Link
            href={`/game/${deal.gameID}`}
            className={styles.card}
        >
            <div className={styles.imageContainer}>
                <Image
                    src={highResThumb}
                    alt={deal.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.image}
                />
                <div className={styles.topRightActions}>
                    <PriceAlertBadge gameID={deal.gameID} />
                    <HeartButton gameID={deal.gameID} className={styles.heartWrapper} />
                </div>
                {savings > 0 && (
                    <div className={styles.savingsBadge}>
                        -{savings}%
                    </div>
                )}
                {isEpicDeal && (
                    <div className="epicDealBadge" style={{ position: 'absolute', bottom: 6, left: 6 }}>🔥 EPIC</div>
                )}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title} title={deal.title}>{deal.title}</h3>

                <div className={styles.priceContainer}>
                    {savings > 0 && (
                        <span className={styles.normalPrice}>${deal.normalPrice}</span>
                    )}
                    <span className={styles.salePrice}>${deal.salePrice}</span>
                </div>

                <div className={styles.meta}>
                    <span className={styles.storeBadge}>{storeName}</span>
                    {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
                        <span className={styles.ratingBadge}>
                            ★ {deal.steamRatingPercent}%
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
