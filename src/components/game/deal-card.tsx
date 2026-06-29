'use client';

import {
  Clock,
  ExternalLink,
  Flame,
  GitCompare,
  Heart,
  Layers,
  Share2,
  ShieldCheck,
  Star,
  Tag,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { dealRedirectUrl, formatLastChecked, isRecentlyVerified } from '@/lib/deal-utils';
import { isOfficialRetailer } from '@/lib/store-trust';
import type { DealWithStore } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
import { useCompare } from '@/store/compare';
import { useWishlist } from '@/store/wishlist';

interface DealCardProps {
  deal: DealWithStore;
  index?: number;
  onOpenDetail?: (deal: DealWithStore) => void;
  /** Optional: number of stores carrying this same game (cross-store variants).
   *  When >1, renders a "N stores" badge so users know there are more options. */
  variantCount?: number;
  /** Optional: callback to open the share dialog for this deal. */
  onShare?: (deal: DealWithStore) => void;
}

function discountTier(savings: number) {
  if (savings >= 90)
    return { label: 'GIVEAWAY', cls: 'from-fuchsia-500 to-amber-400 text-black', hot: true };
  if (savings >= 75)
    return { label: 'MEGA', cls: 'from-amber-400 to-amber-500 text-black', hot: true };
  if (savings >= 50)
    return { label: 'HOT', cls: 'from-primary to-emerald-400 text-primary-foreground', hot: true };
  if (savings >= 25)
    return { label: 'DEAL', cls: 'from-primary/80 to-primary text-primary-foreground', hot: false };
  return { label: 'SAVE', cls: 'from-zinc-600 to-zinc-700 text-white', hot: false };
}

function Stars({ rating }: { rating: number }) {
  if (rating <= 0) return null;
  const _full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Deal rating ${rating} of 10`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3',
            i < Math.round(rating / 2)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  );
}

export function DealCard({
  deal,
  index = 0,
  onOpenDetail,
  variantCount = 1,
  onShare,
}: DealCardProps) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(deal.dealID));
  const compareToggle = useCompare((s) => s.toggle);
  const compareHas = useCompare((s) => s.has(deal.dealID));
  const compareCount = useCompare((s) => s.items.length);
  const compareMax = useCompare((s) => s.maxItems);
  const tier = discountTier(deal.savingsNum);
  const [imgOk, setImgOk] = React.useState(true);
  const compareDisabled = !compareHas && compareCount >= compareMax;

  // Trust signals
  const isVerified = isOfficialRetailer(deal.storeID);
  const lastCheckedLabel = formatLastChecked(deal.lastChange);
  const recentlyVerified = isRecentlyVerified(deal.lastChange, 10);

  const wishlistItem = deal.dealID;

  const delayMs = Math.min(index, 12) * 50;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl glass conic-border lift-on-hover hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_oklch(0.78_0.2_145/0.2)]'
      )}
      style={{
        animation: tier.hot
          ? `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms both, glow-pulse 2.6s ease-in-out ${delayMs + 700}ms infinite`
          : `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${delayMs}ms both`,
      }}
    >
      {/* Premium glow-trace sweep on hover (subtle moving highlight along the top edge) */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      >
        <span
          className="block h-full w-1/3 animate-glow-trace"
          style={{
            background:
              'linear-gradient(90deg, transparent, oklch(0.78 0.2 145 / 0.8), transparent)',
          }}
        />
      </span>
      {/* Cover */}
      <button type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative block aspect-[460/215] w-full overflow-hidden bg-card/60"
        aria-label={`View ${deal.title} details`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-card to-muted">
            <Tag className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Top gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 opacity-90" />

        {/* Discount badge */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-lg bg-gradient-to-br px-2 py-1 text-[11px] font-bold tracking-tight shadow-lg backdrop-blur-sm',
              tier.cls
            )}
          >
            {tier.hot && <Flame className="size-3" />}-{Math.round(deal.savingsNum)}%
          </span>
          {tier.hot && (
            <span className="inline-flex w-fit items-center rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm">
              {tier.label}
            </span>
          )}
        </div>

        {/* Store chip + Verified badge */}
        {deal.store && (
          <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
              <img
                src={`https://www.cheapshark.com${deal.store.images.logo}`}
                alt=""
                className="size-3.5 rounded-[3px] object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              {deal.store.storeName}
            </span>
            {isVerified && (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-primary/25 px-1.5 py-0.5 text-[9px] font-bold text-primary backdrop-blur-md shadow-sm animate-pop-in"
                title="Official retailer — sells publisher-authorized keys"
              >
                <ShieldCheck className="size-2.5" />
                Verified
              </span>
            )}
          </div>
        )}

        {/* Cross-store variants badge — appears when this game is available at multiple stores.
            Rendered as a span (not a button) to avoid nested buttons — clicking anywhere
            on the cover already opens the detail dialog. */}
        {variantCount > 1 && (
          <span
            className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/25 px-2 py-1 text-[10px] font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/20 animate-pop-in"
            aria-label={`${variantCount} stores carry this game`}
            title={`${variantCount} stores carry this game — click to compare`}
          >
            <Layers className="size-3" />
            {variantCount} stores
          </span>
        )}

        {/* Title overlay */}
        <div className={cn('absolute inset-x-0 bottom-0 p-3', variantCount > 1 && 'pr-20')}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-md">
            {deal.title}
          </h3>
          {deal.metacriticScoreNum > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                {deal.metacriticScoreNum}
                <span className="font-medium opacity-80">META</span>
              </span>
              <Stars rating={deal.dealRatingNum} />
            </div>
          )}
        </div>

        {/* Hover-to-reveal quick stats overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <div className="grid w-full grid-cols-2 gap-1.5 animate-overlay-rise">
            {deal.metacriticScoreNum > 0 && (
              <QuickStat
                label="Metacritic"
                value={String(deal.metacriticScoreNum)}
                accent="emerald"
              />
            )}
            {deal.dealRatingNum > 0 && (
              <QuickStat label="Deal rating" value={deal.dealRating} accent="amber" />
            )}
            {deal.steamRatingNum > 0 && (
              <QuickStat label="Steam" value={`${deal.steamRatingNum}%`} accent="primary" />
            )}
            {deal.steamRatingCount && Number(deal.steamRatingCount) > 0 && (
              <QuickStat
                label="Reviews"
                value={formatCount(Number(deal.steamRatingCount))}
                accent="muted"
              />
            )}
            {deal.savingsNum > 0 && (
              <QuickStat
                label="You save"
                value={`$${(deal.normalPriceNum - deal.salePriceNum).toFixed(2)}`}
                accent="primary"
              />
            )}
            <QuickStat
              label="Released"
              value={
                deal.releaseDateMs ? new Date(deal.releaseDateMs).getFullYear().toString() : '—'
              }
              accent="muted"
            />
          </div>
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {deal.isFree ? (
              <span className="text-xl font-semibold tracking-tight text-gradient-emerald">
                FREE
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
                  ${deal.salePrice}
                </span>
                {deal.normalPriceNum > deal.salePriceNum && (
                  <span className="text-xs font-light text-muted-foreground line-through tabular-nums">
                    ${deal.normalPrice}
                  </span>
                )}
              </div>
            )}
            <p className="text-[10px] font-light text-muted-foreground/80">
              {deal.isFree
                ? '100% off'
                : `Save $${(deal.normalPriceNum - deal.salePriceNum).toFixed(2)}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Wishlist */}
            <button type="button"
              onClick={() => toggle(wishlistItem)}
              className={cn(
                'grid size-8 place-items-center rounded-lg border transition-all duration-300',
                has
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
              )}
              aria-label={has ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={has}
            >
              <Heart
                className={cn('size-4 transition-transform', has && 'scale-110 fill-primary')}
              />
            </button>

            {/* Compare */}
            <button type="button"
              onClick={() => compareToggle(deal)}
              disabled={compareDisabled}
              className={cn(
                'grid size-8 place-items-center rounded-lg border transition-all duration-300',
                compareHas
                  ? 'border-hot/50 bg-hot/15 text-hot'
                  : 'border-border/50 bg-card/40 text-muted-foreground hover:border-hot/40 hover:text-hot',
                compareDisabled && 'opacity-40 cursor-not-allowed'
              )}
              aria-label={compareHas ? 'Remove from comparison' : 'Add to comparison'}
              aria-pressed={compareHas}
              title={compareDisabled ? `Max ${compareMax} deals in comparison` : undefined}
            >
              <GitCompare className="size-4" />
            </button>

            {/* Share */}
            {onShare && (
              <button type="button"
                onClick={() => onShare(deal)}
                className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`Share ${deal.title} deal`}
              >
                <Share2 className="size-4" />
              </button>
            )}

            {/* Deal link */}
            <a
              href={dealRedirectUrl(deal.dealID)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
              aria-label={`Open ${deal.title} deal (external)`}
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        {/* Footer meta — trust signals: last checked + verified status */}
        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
          <span
            className="inline-flex min-w-0 items-center gap-1 truncate"
            title={lastCheckedLabel ? `Price last verified ${lastCheckedLabel}` : undefined}
          >
            {lastCheckedLabel ? (
              <>
                <Clock
                  className={cn(
                    'size-3 shrink-0',
                    recentlyVerified ? 'text-primary' : 'text-muted-foreground/70'
                  )}
                />
                <span className={cn('truncate', recentlyVerified && 'text-primary/90 font-medium')}>
                  {lastCheckedLabel}
                </span>
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-primary/70" />
                <span className="truncate">
                  {deal.steamRatingText || `Released ${deal.releaseDateLabel}`}
                </span>
              </>
            )}
          </span>
          {deal.dealRatingNum > 0 && (
            <Badge
              variant="outline"
              className="h-5 shrink-0 gap-1 border-primary/30 px-1.5 text-[9px] font-semibold text-primary"
            >
              <Star className="size-2.5 fill-primary" />
              {deal.dealRating}
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
}

/** Skeleton used while loading. */
export function DealCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl glass">
      <div className="skeleton-shimmer aspect-[460/215] w-full bg-card/60" />
      <div className="space-y-2.5 p-3">
        {/* Title */}
        <div className="flex items-center justify-between gap-2">
          <div className="skeleton-shimmer h-4 w-3/4 rounded bg-card/60" />
          <div className="skeleton-shimmer size-6 rounded-md bg-card/40" />
        </div>
        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <div className="skeleton-shimmer h-6 w-16 rounded bg-card/60" />
          <div className="skeleton-shimmer h-3 w-10 rounded bg-card/40" />
        </div>
        {/* Meta chips */}
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-4 w-12 rounded bg-card/40" />
          <div className="skeleton-shimmer h-4 w-14 rounded bg-card/40" />
        </div>
        {!compact && (
          <div className="flex items-center justify-between border-t border-border/40 pt-2">
            <div className="skeleton-shimmer h-3 w-20 rounded bg-card/40" />
            <div className="skeleton-shimmer h-4 w-10 rounded bg-card/40" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact stat tile used inside the hover overlay. */
function QuickStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'emerald' | 'amber' | 'primary' | 'muted';
}) {
  const colorCls = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    primary: 'text-primary',
    muted: 'text-foreground/80',
  }[accent];
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-center backdrop-blur-sm">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className={cn('font-mono text-xs font-bold tabular-nums', colorCls)}>{value}</p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
