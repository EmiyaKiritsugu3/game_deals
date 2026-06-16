'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deletePriceAlertAction, getUserAlertsAction } from '@/actions/alerts';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import type { PriceAlertWithGame } from '@/types/price-alert';
import styles from './page.module.css';

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <Bell size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>No price alerts yet</h2>
      <p className={styles.emptyText}>
        Browse games and click &ldquo;Alert Me&rdquo; to get notified when the price drops to your
        target.
      </p>
      <Link href="/search" className={styles.browseButton}>
        Browse Games
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.centerState}>
      <div className={styles.spinner} />
      <p>Loading alerts&hellip;</p>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className={styles.emptyState}>
      <Bell size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>Sign in to see your alerts</h2>
      <p className={styles.emptyText}>
        Create an account or sign in to set up price alerts and get notified when games go on sale.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <h2 className={styles.emptyTitle}>Something went wrong</h2>
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}

export default function AlertsPage() {
  const { isLoggedIn } = useAuth();
  const { removeAlert } = useAlerts();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getUserAlertsAction(),
    enabled: isLoggedIn,
  });

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (params: { alertId: string; cheapsharkId: string }) =>
      deletePriceAlertAction(params.alertId),
    onSuccess: (_data, params) => {
      if (params.cheapsharkId) {
        removeAlert(params.cheapsharkId);
      } else {
        console.warn(
          '[alerts] delete success but cheapshark_id is empty — localStorage not synced'
        );
      }
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete alert');
    },
  });

  if (!isLoggedIn) return <SignInPrompt />;
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={(error as Error).message} />;
  if (!alerts || alerts.length === 0) return <EmptyState />;

  return (
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Price Alerts</h1>
          <p className={styles.subtitle}>
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} active
          </p>
        </div>

        {deleteError && (
          <div className={styles.deleteError}>
            <span>Failed to remove alert: {deleteError}</span>
            <button
              type="button"
              className={styles.dismissError}
              onClick={() => setDeleteError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.grid}>
          {alerts.map((row: PriceAlertWithGame) => {
            return (
              <div key={row.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <Bell size={16} className={styles.activeBell} />
                  <span className={styles.alertStatus}>Monitoring</span>
                </div>

                <div className={styles.cardBody}>
                  {row.thumbUrl && (
                    <div className={styles.thumbWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {/* biome-ignore lint/performance/noImgElement: game thumbnails from CDN */}
                      <img src={row.thumbUrl} alt={row.title} className={styles.thumb} />
                    </div>
                  )}

                  <h3 className={styles.cardTitle}>{row.title}</h3>

                  <div className={styles.priceGrid}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>Target</span>
                      <span className={styles.targetPrice}>
                        ${Number(row.targetPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>Current</span>
                      <span
                        className={
                          Number(row.currentPrice ?? 0) <= Number(row.targetPrice ?? 0)
                            ? styles.currentPriceMet
                            : styles.currentPrice
                        }
                      >
                        {row.currentPrice != null
                          ? `$${Number(row.currentPrice).toFixed(2)}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {row.storeId && <div className={styles.storeInfo}>Store: {row.storeId}</div>}
                </div>

                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      deleteMutation.mutate({
                        alertId: row.id,
                        cheapsharkId: row.cheapshark_id,
                      })
                    }
                    disabled={
                      deleteMutation.isPending && deleteMutation.variables?.alertId === row.id
                    }
                    aria-label={`Delete alert for ${row.title}`}
                  >
                    <Trash2 size={16} />
                    {deleteMutation.isPending && deleteMutation.variables?.alertId === row.id
                      ? 'Removing\u2026'
                      : 'Remove'}
                  </button>
                  {row.cheapshark_id ? (
                    <Link href={`/game/${row.cheapshark_id}`} className={styles.viewGameBtn}>
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
          })}
        </div>
      </div>
    </main>
  );
}
