'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import type { PriceAlert } from '@/types/price-alert';

interface AlertsGridProps {
  readonly alerts: PriceAlert[];
}

function EmptyAlertsState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
      <Bell size={64} className="text-muted-foreground/30 mb-2" />
      <h2>No alerts configured</h2>
      <p>Open any game page and click &ldquo;Alert Me&rdquo; to notified when price drops!</p>
    </div>
  );
}

export default function AlertsGrid({ alerts }: AlertsGridProps) {
  if (alerts.length === 0) return <EmptyAlertsState />;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-sm:grid-cols-1">
      {alerts.map((alert) => (
        <div
          key={alert.gameID}
          className="bg-card rounded-lg overflow-hidden border border-border transition-all flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:border-primary"
        >
          <div className="px-5 py-3 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
              Active Monitoring
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3 grow">
            <h3 className="text-lg font-bold m-0 text-foreground truncate">{alert.gameTitle}</h3>
            <div className="grid grid-cols-2 gap-4 my-5 p-4 bg-muted/30 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Target
                </span>
                <span className="text-xl font-extrabold text-primary">
                  ${alert.targetPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Current
                </span>
                <span className="text-xl font-extrabold">${alert.currentPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="mb-6">
              <span className="text-xs font-semibold text-muted-foreground">
                {alert.isKeyshopAllowed ? '✅ Includes Keyshops' : '❌ Official Only'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PriceAlertTrigger
                gameID={alert.gameID}
                gameTitle={alert.gameTitle}
                currentPrice={alert.currentPrice}
                className="w-full"
              />
              <Link
                href={`/game/${alert.gameID}`}
                className="text-xs font-bold text-primary no-underline inline-flex items-center justify-center hover:text-foreground"
              >
                View Game
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
