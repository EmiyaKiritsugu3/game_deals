import { Bell, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { PriceAlertWithGame } from '@/types/price-alert';

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
    <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:border-[color-mix(in_srgb,var(--primary)_30%,transparent)]">
      <div className="px-5 py-3 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
        <Bell size={16} className="text-primary" />
        <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
          Monitoring
        </span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3 grow">
        {alert.thumbUrl && (
          <div className="w-full aspect-video overflow-hidden rounded-md bg-muted">
            <Image
              src={alert.thumbUrl}
              alt={alert.title}
              width={400}
              height={225}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        )}

        <h3 className="text-lg font-bold m-0 text-foreground truncate">{alert.title}</h3>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Target</span>
            <span className="text-xl font-extrabold text-primary">
              ${Number(alert.targetPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Current</span>
            <span
              className={
                isPriceMet
                  ? 'text-xl font-extrabold text-green-500'
                  : 'text-xl font-extrabold text-foreground'
              }
            >
              {currentPriceDisplay}
            </span>
          </div>
        </div>

        {alert.storeId && (
          <div className="text-sm text-muted-foreground">Store: {alert.storeId}</div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border/50 flex gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[hsl(0,65%,50%,0.3)] bg-[hsl(0,65%,50%,0.15)] text-[hsl(0,65%,28%)] font-bold text-sm cursor-pointer hover:bg-[hsl(0,65%,50%,0.15)] hover:border-[hsl(0,65%,50%)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete alert for ${alert.title}`}
        >
          <Trash2 size={16} />
          {isDeleting ? 'Removing…' : 'Remove'}
        </button>
        {alert.cheapshark_id ? (
          <Link
            href={`/game/${alert.cheapshark_id}`}
            className="inline-flex items-center justify-center flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm no-underline hover:-translate-y-0.5 hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            View Game
          </Link>
        ) : (
          <span
            className="inline-flex items-center justify-center flex-1 px-4 py-2.5 rounded-lg bg-muted text-muted-foreground font-bold text-sm opacity-50 cursor-not-allowed"
            aria-disabled="true"
          >
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}
