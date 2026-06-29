'use client';

import {
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  GitCompare,
  Heart,
  Star,
  Store as StoreIcon,
  TrendingDown,
  Trophy,
  X,
} from 'lucide-react';
import Image from 'next/image';
import type * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dealRedirectUrl } from '@/lib/deal-utils';
import type { DealWithStore } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
import { useCompare } from '@/store/compare';
import { useWishlist } from '@/store/wishlist';

/**
 * Floating comparison tray — appears at the bottom of the viewport when the
 * user has selected at least one deal for comparison. Opens a side-by-side
 * modal showing the best price, biggest savings, highest rating, etc.
 */
export function CompareTray() {
  const { items, isOpen, open: openModal, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl glass-panel border-primary/30 p-2.5 shadow-2xl shadow-primary/10 animate-rise-fade">
          <div className="flex items-center gap-2 pl-1">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <GitCompare className="size-4" />
            </span>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-tight">Compare deals</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {items.length}/3 selected
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
            {items.map((deal) => (
              <div
                key={deal.dealID}
                className="group relative h-12 w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-border/40"
              >
                <Image
                  src={deal.thumb}
                  alt={deal.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
                <button type="button"
                  onClick={() => remove(deal.dealID)}
                  className="absolute right-0 top-0 grid size-4 place-items-center bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${deal.title} from comparison`}
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
            {items.length < 3 &&
              Array.from({ length: 3 - items.length }).map((_, i) => (
                <div
              {/* biome-ignore lint/suspicious/noArrayIndexKey: stable */}
                  key={`empty-${i}`}
                  className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-dashed border-border/40 text-muted-foreground/40"
                >
                  <GitCompare className="size-4" />
                </div>
              ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={openModal}
              disabled={items.length < 2}
              className="gap-1.5 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:brightness-110 sheen"
            >
              <GitCompare className="size-3.5" />
              Compare
              {items.length < 2 && (
                <span className="text-[10px] font-normal opacity-80">
                  (need {2 - items.length} more)
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <CompareDialog open={isOpen} onOpenChange={(v) => !v && useCompare.getState().close()} />
    </>
  );
}

function CompareDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, remove, clear } = useCompare();
  const toggleWishlist = useWishlist((s) => s.toggle);
  const hasWishlist = useWishlist((s) => s.has);

  if (items.length === 0) return null;

  // Compute winners
  const cheapest = items.reduce(
    (min, d) => (d.salePriceNum < min.salePriceNum ? d : min),
    items[0]
  );
  const biggestSavings = items.reduce(
    (max, d) => (d.savingsNum > max.savingsNum ? d : max),
    items[0]
  );
  const highestRated = items.reduce(
    (max, d) => (d.dealRatingNum > max.dealRatingNum ? d : max),
    items[0]
  );
  const bestMetacritic = items.reduce(
    (max, d) => (d.metacriticScoreNum > max.metacriticScoreNum ? d : max),
    items[0]
  );

  const isWinner = (deal: DealWithStore, winner: DealWithStore) => deal.dealID === winner.dealID;

  const rows: {
    label: string;
    icon: React.ElementType;
    render: (d: DealWithStore) => React.ReactNode;
    winner: DealWithStore;
  }[] = [
    {
      label: 'Price',
      icon: DollarSign,
      render: (d) => (
        <span
          className={cn('font-mono font-bold tabular-nums', d.isFree && 'text-gradient-emerald')}
        >
          {d.isFree ? 'FREE' : `$${d.salePrice}`}
        </span>
      ),
      winner: cheapest,
    },
    {
      label: 'Retail',
      icon: DollarSign,
      render: (d) => (
        <span className="font-mono text-muted-foreground tabular-nums line-through">
          ${d.normalPrice}
        </span>
      ),
      winner: items.reduce((max, d) => (d.normalPriceNum > max.normalPriceNum ? d : max), items[0]),
    },
    {
      label: 'Savings',
      icon: TrendingDown,
      render: (d) => (
        <span className={cn('font-mono font-bold tabular-nums', d.savingsNum >= 75 && 'text-hot')}>
          -{Math.round(d.savingsNum)}%
        </span>
      ),
      winner: biggestSavings,
    },
    {
      label: 'Deal rating',
      icon: Star,
      render: (d) =>
        d.dealRatingNum > 0 ? (
          <span className="inline-flex items-center gap-1 font-mono font-bold">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {d.dealRating}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      winner: highestRated,
    },
    {
      label: 'Metacritic',
      icon: Trophy,
      render: (d) =>
        d.metacriticScoreNum > 0 ? (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          >
            {d.metacriticScoreNum}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      winner: bestMetacritic,
    },
    {
      label: 'Store',
      icon: StoreIcon,
      render: (d) =>
        d.store ? (
          <span className="inline-flex items-center gap-1.5">
            {}
          {/* biome-ignore lint/performance/noImgElement: external logo */}
            <img src={`https://www.cheapshark.com${d.store.images.logo}`} alt="" className="size-4 rounded object-contain" />
            <span className="text-xs">{d.store.storeName}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      winner: cheapest,
    },
    {
      label: 'Released',
      icon: Calendar,
      render: (d) => <span className="text-xs text-muted-foreground">{d.releaseDateLabel}</span>,
      winner: items.reduce((max, d) => (d.releaseDateMs > max.releaseDateMs ? d : max), items[0]),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden rounded-2xl border-border/60 bg-card/85 p-0 backdrop-blur-2xl">
        <DialogHeader className="border-b border-border/40 p-5">
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <GitCompare className="size-4" />
            </span>
            Side-by-side comparison
          </DialogTitle>
          <DialogDescription>
            Comparing {items.length} deals. Green checkmarks highlight the winner in each category.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto p-5">
          {/* Header row: game covers */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `120px repeat(${items.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {items.map((deal) => (
              <div key={deal.dealID} className="space-y-2">
                <div className="relative aspect-[460/215] overflow-hidden rounded-lg bg-card/60">
                  <Image
                    src={deal.thumb}
                    alt={deal.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized
                  />
                  <button type="button"
                    onClick={() => remove(deal.dealID)}
                    className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md bg-black/70 text-white backdrop-blur-md transition-colors hover:bg-destructive/80"
                    aria-label={`Remove ${deal.title} from comparison`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{deal.title}</p>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <div className="mt-5 space-y-1">
            {rows.map((row, ri) => (
              <div
                key={row.label}
                className={cn(
                  'grid items-center gap-3 rounded-lg px-2 py-2.5 transition-colors',
                  ri % 2 === 0 ? 'bg-card/30' : '',
                  'hover:bg-accent/20'
                )}
                style={{
                  gridTemplateColumns: `120px repeat(${items.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <row.icon className="size-3.5" />
                  {row.label}
                </div>
                {items.map((deal) => {
                  const win = isWinner(deal, row.winner);
                  return (
                    <div
                      key={deal.dealID}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-all',
                        win && 'bg-primary/10 ring-1 ring-primary/30'
                      )}
                    >
                      {win && (
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary animate-pop-in" />
                      )}
                      <span className={cn(win && 'font-semibold')}>{row.render(deal)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary + actions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <DollarSign className="size-3" /> Best price
              </p>
              <p className="mt-1 text-sm font-bold">{cheapest.title}</p>
              <p className="font-mono text-lg font-bold text-gradient-emerald">
                {cheapest.isFree ? 'FREE' : `$${cheapest.salePrice}`}
              </p>
            </div>
            <div className="rounded-xl border border-hot/20 bg-hot/5 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-hot">
                <TrendingDown className="size-3" /> Biggest savings
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-bold">{biggestSavings.title}</p>
              <p className="font-mono text-lg font-bold text-hot">
                -{Math.round(biggestSavings.savingsNum)}%
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <Star className="size-3 fill-amber-400" /> Highest rated
              </p>
              <p className="mt-1 line-clamp-1 text-sm font-bold">{highestRated.title}</p>
              <p className="font-mono text-lg font-bold text-amber-400">
                {highestRated.dealRating}
              </p>
            </div>
          </div>

          {/* Per-deal actions */}
          <div
            className="mt-4 grid gap-3"
            style={{ gridTemplateColumns: `120px repeat(${items.length}, minmax(0, 1fr))` }}
          >
            <div />
            {items.map((deal) => {
              const wished = hasWishlist(deal.dealID);
              return (
                <div key={deal.dealID} className="flex flex-col gap-1.5">
                  <a
                    href={dealRedirectUrl(deal.dealID)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:brightness-110 sheen"
                  >
                    <ExternalLink className="size-3.5" />
                    Get deal
                  </a>
                  <button type="button"
                    onClick={() =>
                      toggleWishlist(deal.dealID)
                    }
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                      wished
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
                    )}
                  >
                    <Heart className={cn('size-3.5', wished && 'fill-primary')} />
                    {wished ? 'Wishlisted' : 'Wishlist'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
              Clear all
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
