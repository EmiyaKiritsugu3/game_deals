import { Bell, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { PriceAlertWithGame } from '@/types/price-alert';
import styles from './AlertCard.module.css';

interface AlertCardProps {
  readonly alert: PriceAlertWithGame;
  readonly onDelete: () => void;
  readonly isDeleting: boolean;
}

export default function AlertCard({ alert, onDelete, isDeleting }: AlertCardProps) {
  const currentPriceDisplay =
    alert.currentPrice !== null && alert.currentPrice !== undefined
      ? `$${Number(alert.currentPrice).toFixed(2)}`
      : 'N/A';

  const isPriceMet = Number(alert.currentPrice ?? 0) <= Number(alert.targetPrice ?? 0);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Bell size={16} className={styles.activeBell} />
        <span className={styles.alertStatus}>Monitoring</span>
      </div>

      <div className={styles.cardBody}>
        {alert.thumbUrl && (
          <div className={styles.thumbWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* biome-ignore lint/performance/noImgElement: game thumbnails from CDN */}
            <img src={alert.thumbUrl} alt={alert.title} className={styles.thumb} />
          </div>
        )}

        <h3 className={styles.cardTitle}>{alert.title}</h3>

        <div className={styles.priceGrid}>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Target</span>
            <span className={styles.targetPrice}>${Number(alert.targetPrice).toFixed(2)}</span>
          </div>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>Current</span>
            <span className={isPriceMet ? styles.currentPriceMet : styles.currentPrice}>
              {currentPriceDisplay}
            </span>
          </div>
        </div>

        {alert.storeId && <div className={styles.storeInfo}>Store: {alert.storeId}</div>}
      </div>

      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete alert for ${alert.title}`}
        >
          <Trash2 size={16} />
          {isDeleting ? 'Removing\u2026' : 'Remove'}
        </button>
        {alert.cheapshark_id ? (
          <Link href={`/game/${alert.cheapshark_id}`} className={styles.viewGameBtn}>
            View Game
          </Link>
        ) : (
          <span className={styles.viewGameBtnDisabled} aria-disabled="true">
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}
