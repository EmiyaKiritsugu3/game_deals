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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)] max-w-[600px] mx-auto">
      <Bell size={64} className="text-muted-foreground opacity-50" />
      <h2 className="text-2xl text-foreground m-0">No price alerts yet</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">
        Browse games and click &ldquo;Alert Me&rdquo; to get notified when the price drops to your
        target.
      </p>
      <Link
        href="/search"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold no-underline"
      >
        Browse Games
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-8 gap-4 text-muted-foreground">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p>Loading alerts&hellip;</p>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)] max-w-[600px] mx-auto">
      <Bell size={64} className="text-muted-foreground opacity-50" />
      <h2 className="text-2xl text-foreground m-0">Sign in to see your alerts</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">
        Create an account or sign in to set up price alerts and get notified when games go on sale.
      </p>
    </div>
  );
}

function ErrorState({ message }: { readonly message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)] max-w-[600px] mx-auto">
      <h2 className="text-2xl text-foreground m-0">Something went wrong</h2>
      <p className="text-muted-foreground max-w-[400px] m-0">{message}</p>
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
    <div className="py-12 min-h-[calc(100vh-120px)]">
      <div className="container flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-foreground m-0">My Price Alerts</h1>
          <p className="text-muted-foreground text-base m-0">
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} active
          </p>
        </div>

        {deleteError && (
          <div className="flex items-center justify-between p-3 bg-[hsl(0,65%,50%,0.1)] border border-[hsl(0,65%,50%,0.3)] rounded-lg text-[hsl(0,65%,65%)] text-sm font-semibold">
            <span>Failed to remove alert: {deleteError}</span>
            <button
              type="button"
              className="bg-none border border-[hsl(0,65%,50%,0.3)] text-[hsl(0,65%,50%)] px-3 py-1 rounded-lg cursor-pointer font-bold text-xs"
              onClick={() => setDeleteError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
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
