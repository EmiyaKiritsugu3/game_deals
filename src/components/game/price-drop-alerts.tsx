'use client';

import { Bell, BellRing, Sparkles, TrendingDown, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dealRedirectUrl } from '@/lib/deal-utils';
import type { DealWithStore } from '@/lib/types';
import { useWishlist } from '@/store/wishlist';

/**
 * Price-drop alert system (simulated).
 *
 * Periodically "checks" wishlisted games against the live deals feed and, when
 * a price is found strictly lower than the recorded lowest, fires a sonner toast
 * and records the event in the wishlist store (so the wishlist drawer can surface
 * it). Purely client-side — a real implementation would use a server cron +
 * push channel, but the UX flow is identical.
 *
 * The check runs at most once per CHECK_INTERVAL and only when the tab is visible.
 */
const CHECK_INTERVAL = 45_000; // 45s — gentle on the API

interface PriceDropAlertsProps {
  /** Live deals feed used to simulate price re-checks. */
  liveDeals: DealWithStore[];
  /** Minimum drop percentage to trigger an alert (0-100). Default 0 = any drop. */
  dropThreshold?: number;
}

export function PriceDropAlerts({ liveDeals, dropThreshold = 0 }: PriceDropAlertsProps) {
  const items = useWishlist((s) => s.items);
  const recordPriceCheck = useWishlist((s) => s.recordPriceCheck);
  const priceDrops = useWishlist((s) => s.priceDrops);
  const dismissPriceDrop = useWishlist((s) => s.dismissPriceDrop);
  const clearPriceDrops = useWishlist((s) => s.clearPriceDrops);
  const openWishlist = useWishlist((s) => s.open);
  const lastCheckRef = React.useRef(0);
  const firedRef = React.useRef<Set<string>>(new Set());

  // Build a lookup of the latest price for each gameID in the live feed.
  const priceMap = React.useMemo(() => {
    const map = new Map<string, { price: number; storeName?: string }>();
    for (const d of liveDeals) {
      const existing = map.get(d.gameID);
      if (!existing || d.salePriceNum < existing.price) {
        map.set(d.gameID, {
          price: d.salePriceNum,
          storeName: d.store?.storeName,
        });
      }
    }
    return map;
  }, [liveDeals]);

  const runCheck = React.useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (items.length === 0 || liveDeals.length === 0) return;

    let dropped = 0;
    for (const item of items) {
      const latest = priceMap.get(item.gameID);
      if (!latest) continue;
      // Calculate the drop percentage relative to the lowest seen price
      const dropPct =
        item.lowestPrice > 0 ? ((item.lowestPrice - latest.price) / item.lowestPrice) * 100 : 0;
      // Only fire if the drop meets the user's threshold preference
      const meetsThreshold = dropPct >= dropThreshold;
      // Only fire a toast for genuine drops we haven't toasted this session.
      if (
        meetsThreshold &&
        latest.price < item.lowestPrice &&
        item.lowestPrice > 0 &&
        !firedRef.current.has(`${item.dealID}-${latest.price}`)
      ) {
        firedRef.current.add(`${item.dealID}-${latest.price}`);
        recordPriceCheck(item.dealID, latest.price, latest.storeName);
        dropped++;
        toast.success('Price drop detected!', {
          id: `drop-${item.dealID}-${latest.price}`,
          icon: <TrendingDown className="size-4 text-primary" />,
          description: `${item.title} is now $${latest.price.toFixed(2)} (was $${item.lowestPrice.toFixed(2)})`,
          action: {
            label: 'View deal',
            onClick: () => window.open(dealRedirectUrl(item.dealID), '_blank'),
          },
          duration: 8000,
        });
      } else if (latest.price < item.lowestPrice) {
        // Already toasted this drop — still record silently.
        recordPriceCheck(item.dealID, latest.price, latest.storeName);
      }
    }
    if (dropped > 0) {
      // Extra celebratory toast if multiple dropped at once.
      if (dropped > 1) {
        toast(`${dropped} wishlisted games just dropped in price`, {
          icon: <Sparkles className="size-4 text-primary" />,
        });
      }
    }
  }, [items, liveDeals, priceMap, recordPriceCheck, dropThreshold]);

  const runCheckRef = React.useRef(runCheck);
  runCheckRef.current = runCheck;

  React.useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now - lastCheckRef.current >= CHECK_INTERVAL) {
        lastCheckRef.current = now;
        runCheckRef.current();
      }
    };
    // Initial check shortly after mount (lets the feed populate).
    const initial = setTimeout(tick, 4000);
    const interval = setInterval(tick, CHECK_INTERVAL);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const activeDrops = priceDrops.filter((d) => !d.dismissed);
  if (activeDrops.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[min(92vw,360px)] animate-rise-fade">
      <div className="relative overflow-hidden rounded-2xl glass-strong border-primary/30 p-3 shadow-2xl shadow-primary/10">
        <div className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/20 opacity-60 blur-2xl animate-glow-pulse" />
        <div className="relative">
          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="relative grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <BellRing className="size-4" />
                <span className="absolute inset-0 rounded-lg ring-1 ring-primary/30 animate-pulse-ring" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-tight">Price alerts</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {activeDrops.length} drop{activeDrops.length > 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearPriceDrops}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
              aria-label="Dismiss all price alerts"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {activeDrops.slice(0, 4).map((drop) => {
              const pctOff =
                drop.oldPrice > 0
                  ? Math.round(((drop.oldPrice - drop.newPrice) / drop.oldPrice) * 100)
                  : 0;
              return (
                <li
                  key={drop.id}
                  className="group flex items-center gap-2.5 rounded-lg border border-border/40 bg-card/40 p-2 transition-colors hover:border-primary/30"
                >
                  <div
                    className="size-9 shrink-0 rounded-md bg-cover bg-center ring-1 ring-border/40"
                    style={{ backgroundImage: `url(${drop.thumb})` }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-semibold">{drop.title}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-gradient-emerald">
                        ${drop.newPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                        ${drop.oldPrice.toFixed(2)}
                      </span>
                      <Badge
                        variant="outline"
                        className="h-4 gap-0.5 border-primary/40 px-1 text-[9px] font-bold text-primary"
                      >
                        <TrendingDown className="size-2.5" />
                        {pctOff}%
                      </Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissPriceDrop(drop.id)}
                    className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    aria-label={`Dismiss alert for ${drop.title}`}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            onClick={() => {
              openWishlist();
              clearPriceDrops();
            }}
            size="sm"
            className="mt-2 w-full gap-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
            variant="ghost"
          >
            <Bell className="size-3.5" />
            Open wishlist to claim
          </Button>
        </div>
      </div>
    </div>
  );
}
