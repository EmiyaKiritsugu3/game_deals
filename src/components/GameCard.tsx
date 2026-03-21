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
    const store = stores[deal.storeID] || `Store ${deal.storeID}`; // Changed storeName to store
    const highResThumb = getHighResImage(deal.thumb);
    const isFree = parseFloat(deal.salePrice) === 0; // Changed deal.price to deal.salePrice to match original logic
    const isEpicDeal = savings >= 75 || isFree; // Reverted to original logic for EPIC
    const isHistoricalLow = savings > 85; // Reverted to original logic for HL

    return (

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
