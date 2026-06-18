'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deletePriceAlertAction, getUserAlertsAction } from '@/actions/alerts';
import AlertCard from '@/components/AlertCard';
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

function ErrorState({ message }: { readonly message: string }) {
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
    <div className={styles.main}>
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
          {alerts.map((alert: PriceAlertWithGame) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={() =>
                deleteMutation.mutate({
                  alertId: alert.id,
                  cheapsharkId: alert.cheapshark_id,
                })
              }
              isDeleting={
                deleteMutation.isPending && deleteMutation.variables?.alertId === alert.id
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
