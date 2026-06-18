'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import type { PriceAlert } from '@/types/price-alert';
import styles from './AlertsGrid.module.css';

interface AlertsGridProps {
  alerts: PriceAlert[];
}

function EmptyAlertsState() {
  return (
    <div className={styles.emptyState}>
      <Bell
        size={64}
        className={styles.emptyIcon}
        style={{ color: 'hsl(var(--muted-foreground)/0.3)' }}
      />
      <h2>No alerts configured</h2>
      <p>
        Open any game page and click &ldquo;Alert Me&rdquo; to be notified when the price drops!
      </p>
    </div>
  );
}

export default function AlertsGrid({ alerts }: AlertsGridProps) {
  if (alerts.length === 0) return <EmptyAlertsState />;

  return (
    <div className={styles.grid}>
      {alerts.map((alert) => (
        <div key={alert.gameID} className={styles.wishlistCard}>
          <div className={styles.alertHeader}>
            <Bell size={16} className={styles.activeBell} />
            <span className={styles.alertStatus}>Active Monitoring</span>
          </div>
          <div className={styles.content}>
            <h3 className={styles.cardTitle}>{alert.gameTitle}</h3>
            <div className={styles.alertPrices}>
              <div className={styles.alertPriceBlock}>
                <span className={styles.alertLabel}>Target</span>
                <span className={styles.targetValue}>${alert.targetPrice.toFixed(2)}</span>
              </div>
              <div className={styles.alertPriceBlock}>
                <span className={styles.alertLabel}>Current</span>
                <span className={styles.currentValue}>${alert.currentPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className={styles.alertMeta}>
              <span className={styles.keyshopLabel}>
                {alert.isKeyshopAllowed ? '✅ Includes Keyshops' : '❌ Official Only'}
              </span>
            </div>
            <div className={styles.alertFooter}>
              <PriceAlertTrigger
                gameID={alert.gameID}
                gameTitle={alert.gameTitle}
                currentPrice={alert.currentPrice}
                className={styles.editAlertBtn}
              />
              <Link href={`/game/${alert.gameID}`} className={styles.viewDetailsBtn}>
                View Game
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
