import Image from 'next/image';
import Link from 'next/link';
import { Deal, getStores, getHighResImage } from '../services/api';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';
import styles from './GameCard.module.css';
import DealsBadge from './DealsBadge';
import AddToListButton from './AddToListButton';

export default async function GameCard({ deal }: { deal: Deal }) {
    const savings = Math.round(parseFloat(deal.savings));
    const stores = await getStores();
    const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
    const highResThumb = getHighResImage(deal.thumb);
    const isFree = parseFloat(deal.salePrice) === 0;
    const isEpicDeal = savings >= 75 || isFree;
    const isHistoricalLow = savings > 85;

    return (
        <Link href={`/game/${deal.gameID}`} className={styles.card}>
            <div className={styles.imageContainer}>
                <Image
                    src={highResThumb}
                    alt={deal.title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                <div className={styles.overlay}>
                    <div className={styles.badgeContainer}>
                        {isEpicDeal && <DealsBadge type="EPIC" />}
                        {isHistoricalLow && <DealsBadge type="HL" />}
                    </div>

                    <div className={styles.actionsContainer}>
                        <PriceAlertBadge gameID={deal.gameID} className={styles.alertBadge} />
                        <AddToListButton gameId={deal.gameID} className={styles.listBtn} />
                        <HeartButton gameID={deal.gameID} className={styles.heartBtn} />
                    </div>
                </div>

                {savings > 0 && !isFree && (
                    <div className={styles.savingsBadge}>
                        -{savings}%
                    </div>
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