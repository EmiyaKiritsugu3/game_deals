'use client';

import {
  ArrowDownRight,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  Minus,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

/**
 * Price-drop Watchlist Panel — a dedicated section (not a drawer) that shows
 * wishlisted games with their live price status, lowest-ever, and
 * drop-since-added metrics. Renders inline in the page (not a slide-out) so
 * users can monitor their watchlist while browsing.
 *
 * Only renders when the user has at least 1 wishlisted game.
 */
export function PriceWatchlistPanel() {
  const items = useWishlist((s) => s.items);
  const [sortBy, setSortBy] = React.useState<'recent' | 'biggest-drop' | 'lowest-price'>('recent');

  const sorted = React.useMemo(() => {
    const arr = [...items];
    switch (sortBy) {
      case 'biggest-drop':
        return arr.sort(
          (a, b) =>
            (Number(b.normalPrice) - Number(b.salePrice)) / Number(b.normalPrice) -
            (Number(a.normalPrice) - Number(a.salePrice)) / Number(a.normalPrice)
        );
      case 'lowest-price':
        return arr.sort((a, b) => Number(a.salePrice) - Number(b.salePrice));
      default:
        return arr.sort((a, b) => b.addedAt - a.addedAt);
    }
  }, [items, sortBy]);

  if (items.length === 0) return null;

  const totalSaved = items.reduce((s, i) => s + (Number(i.normalPrice) - Number(i.salePrice)), 0);
  const atLowestCount = items.filter(
    (i) => i.lowestPrice === Number(i.salePrice) && Number(i.salePrice) > 0
  ).length;
  const freeCount = items.filter((i) => Number(i.salePrice) === 0).length;

  return (
    <section id="watchlist" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Eye className="size-3.5" />
              Watchlist
            </span>
            <span className="text-xs text-muted-foreground">
              {items.length} game{items.length === 1 ? '' : 's'} · {atLowestCount} at all-time low
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Your price <span className="text-gradient-emerald">watchlist</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live price tracking for games you&apos;re interested in.
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 p-1 text-xs backdrop-blur-md">
          {(
            [
              { key: 'recent', label: 'Recent' },
              { key: 'biggest-drop', label: 'Biggest drop' },
              { key: 'lowest-price', label: 'Lowest price' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                sortBy === opt.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SummaryCard
          icon={TrendingDown}
          label="Total saved"
          value={`$${totalSaved.toFixed(2)}`}
          accent="text-primary"
        />
        <SummaryCard
          icon={Crown}
          label="At all-time low"
          value={String(atLowestCount)}
          accent="text-amber-400"
        />
        <SummaryCard
          icon={ShoppingBag}
          label="Free claimed"
          value={String(freeCount)}
          accent="text-fuchsia-300"
        />
      </div>

      {/* Watchlist table — card-based for mobile, table for desktop */}
      <div className="overflow-hidden rounded-2xl glass">
        {/* Header row (desktop only) */}
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/40 bg-card/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Game</span>
          <span className="text-right">Current</span>
          <span className="text-right">Lowest</span>
          <span className="text-right">Since added</span>
          <span className="text-right">Action</span>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-border/40">
          {sorted.map((item, i) => {
            const salePrice = Number(item.salePrice) || 0;
            const normalPrice = Number(item.normalPrice) || 0;
            const lowest = item.lowestPrice ?? salePrice;
            const baseline = item.baselinePrice ?? salePrice;
            const dropSinceAdded = baseline > 0 ? ((baseline - salePrice) / baseline) * 100 : 0;
            const isAtLowest = salePrice > 0 && salePrice <= lowest;
            const isFree = salePrice === 0;
            const isDropped = dropSinceAdded >= 1;
            const _savingsPct =
              normalPrice > 0
                ? Math.round(
                    dropSinceAdded > 0 ? ((normalPrice - salePrice) / normalPrice) * 100 : 0
                  )
                : 0;

            return (
              <li
                key={item.dealID}
                className="grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-accent/20 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4"
                style={{ animation: `fade-in-up 0.4s ease ${i * 50}ms both` }}
              >
                {/* Game info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-card/60">
                    <Image
                      src={item.thumb}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {item.storeName && <span className="truncate">{item.storeName}</span>}
                      {isAtLowest && !isFree && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 font-semibold text-amber-400">
                          <Crown className="size-2.5" />
                          ATL
                        </span>
                      )}
                      {isFree && (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-1.5 py-0.5 font-semibold text-fuchsia-300">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current price */}
                <div className="flex items-center justify-between sm:justify-end sm:text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">
                    Current
                  </span>
                  <div>
                    <p className="font-mono text-sm font-bold tabular-nums text-gradient-emerald">
                      {isFree ? 'FREE' : `$${salePrice.toFixed(2)}`}
                    </p>
                    {!isFree && normalPrice > salePrice && (
                      <p className="text-[10px] text-muted-foreground line-through tabular-nums">
                        ${normalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lowest ever */}
                <div className="flex items-center justify-between sm:justify-end sm:text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">
                    Lowest
                  </span>
                  <div>
                    <p
                      className={cn(
                        'font-mono text-sm font-semibold tabular-nums',
                        isAtLowest ? 'text-amber-400' : 'text-muted-foreground'
                      )}
                    >
                      {isFree ? '—' : `$${lowest.toFixed(2)}`}
                    </p>
                    {item.lastChecked && (
                      <p className="text-[10px] text-muted-foreground">
                        <Clock className="mr-0.5 inline size-2.5" />
                        {formatRelative(item.lastChecked)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Drop since added */}
                <div className="flex items-center justify-between sm:justify-end sm:text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:hidden">
                    Since added
                  </span>
                  <div className="flex items-center gap-1">
                    {isDropped ? (
                      <>
                        <ArrowDownRight className="size-3.5 text-primary" />
                        <span className="font-mono text-sm font-bold text-primary tabular-nums">
                          {Math.round(dropSinceAdded)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
                          0%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-end gap-1.5">
                  <a
                    href={dealRedirectUrl(item.dealID)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                    aria-label={`Open ${item.title} deal`}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer hint */}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <RefreshCw className="size-3" />
        Prices auto-refresh every 5 minutes. Open the wishlist drawer to add or remove games.
      </p>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl glass p-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg bg-card/60', accent)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={cn('font-mono text-lg font-bold tabular-nums truncate', accent)}>{value}</p>
      </div>
    </div>
  );
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
