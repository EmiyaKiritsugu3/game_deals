'use client';

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Pause,
  Play,
  Star,
  TrendingDown,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface DealOfTheHourProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

const ROTATION_MS = 12_000; // 12 seconds per deal

/**
 * "Deal of the Hour" — a compact rotating spotlight that cycles through the
 * top 5 deals every 12 seconds. Auto-advances with a progress bar; pauses on
 * hover or when the user manually navigates.
 *
 * Distinct from "Deal of the Day" (which is a single deterministic pick) —
 * this section rotates through multiple high-value deals to keep the page
 * feeling alive and showcase variety.
 */
export function DealOfTheHour({ deals, onOpenDetail }: DealOfTheHourProps) {
  // Pick top 5 by deal rating × savings, deduplicated
  const top5 = React.useMemo(() => {
    return dedupeToList(deals, 30)
      .filter((d) => d.dealRatingNum >= 7 && d.savingsNum >= 50)
      .sort((a, b) => b.dealRatingNum * b.savingsNum - a.dealRatingNum * a.savingsNum)
      .slice(0, 5);
  }, [deals]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Auto-advance with progress tracking
  React.useEffect(() => {
    if (paused || top5.length <= 1) return;
    const interval = 50; // update every 50ms for smooth progress
    const totalSteps = ROTATION_MS / interval;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setProgress((step / totalSteps) * 100);
      if (step >= totalSteps) {
        step = 0;
        setActiveIndex((i) => (i + 1) % top5.length);
        setProgress(0);
      }
    }, interval);
    return () => clearInterval(id);
  }, [paused, top5.length]);

  // Reset index if deals change
  React.useEffect(() => {
    if (activeIndex >= top5.length) setActiveIndex(0);
  }, [top5.length, activeIndex]);

  if (top5.length === 0) return null;

  const activeDeal = top5[activeIndex];

  const goTo = (dir: 1 | -1) => {
    setActiveIndex((i) => (i + dir + top5.length) % top5.length);
    setProgress(0);
  };

  return (
    <section
      id="deal-of-hour"
      className="mx-auto mt-12 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-hot/30 glass-strong"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.16 70 / 0.6), transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.2 145 / 0.6), transparent 60%)',
          }}
        />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          {/* Left: cover */}
          <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-2xl bg-card/60 sm:w-56 sm:aspect-square">
            <button
              type="button"
              onClick={() => onOpenDetail?.(activeDeal)}
              className="absolute inset-0 size-full"
              aria-label={`View ${activeDeal.title} details`}
            >
              <Image
                key={activeDeal.dealID}
                src={activeDeal.thumb}
                alt={activeDeal.title}
                fill
                sizes="224px"
                className="object-cover transition-transform duration-700 hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Rank badge */}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-hot to-amber-500 px-2 py-1 text-[10px] font-extrabold text-black shadow-lg">
                <Flame className="size-2.5" />#{activeIndex + 1}
              </span>
            </button>
          </div>

          {/* Middle: details */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-hot/10 px-2.5 py-1 text-xs font-semibold text-hot">
                <Clock className="size-3.5" />
                Deal of the Hour
              </span>
              {activeDeal.store && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 px-2 py-1 text-[10px] font-medium backdrop-blur-md">
                  <img
                    src={activeDeal.store.logoUrl}
                    alt=""
                    className="size-3 rounded-[2px] object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  {activeDeal.store.storeName}
                </span>
              )}
              {paused && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  <Pause className="size-2.5" />
                  Paused
                </span>
              )}
            </div>

            {/* Title */}
            <button
              type="button"
              onClick={() => onOpenDetail?.(activeDeal)}
              className="mt-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded"
            >
              <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight sm:text-xl">
                {activeDeal.title}
              </h3>
            </button>

            {/* Ratings */}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
              {activeDeal.dealRatingNum > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="font-mono font-bold">{activeDeal.dealRating}</span>
                  <span className="text-muted-foreground">rating</span>
                </span>
              )}
              {activeDeal.metacriticScoreNum > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="font-mono font-bold">{activeDeal.metacriticScoreNum}</span>
                  <span className="text-muted-foreground">Metacritic</span>
                </span>
              )}
            </div>

            {/* Price + actions */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-gradient-emerald sm:text-3xl">
                    {activeDeal.isFree ? 'FREE' : `$${activeDeal.salePrice}`}
                  </span>
                  {!activeDeal.isFree && activeDeal.normalPriceNum > activeDeal.salePriceNum && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums">
                      ${activeDeal.normalPrice}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-hot">
                  <TrendingDown className="size-3" />
                  Save {Math.round(activeDeal.savingsNum)}%
                </p>
              </div>

              <div className="flex items-center gap-2">
                <HourWishlistButton deal={activeDeal} />
                <a
                  href={dealRedirectUrl(activeDeal.dealID)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-hot to-amber-500 px-4 py-2 text-sm font-bold text-black shadow-md shadow-hot/30 transition-all hover:brightness-110 sheen"
                >
                  Get deal
                </a>
              </div>
            </div>
          </div>

          {/* Right: navigation */}
          <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => goTo(-1)}
              className="grid size-9 place-items-center rounded-full border border-border/50 bg-card/40 backdrop-blur-md transition-all hover:border-hot/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hot/40"
              aria-label="Previous deal"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="grid size-9 place-items-center rounded-full border border-border/50 bg-card/40 backdrop-blur-md transition-all hover:border-hot/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hot/40"
              aria-label={paused ? 'Resume auto-advance' : 'Pause auto-advance'}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="grid size-9 place-items-center rounded-full border border-border/50 bg-card/40 backdrop-blur-md transition-all hover:border-hot/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hot/40"
              aria-label="Next deal"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress bar + dots */}
        <div className="relative flex items-center gap-3 px-5 pb-4 sm:px-6">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {top5.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  setProgress(0);
                }}
                aria-label={`Go to deal ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === activeIndex ? 'w-6 bg-hot' : 'w-1.5 bg-border/60 hover:bg-border'
                )}
              />
            ))}
          </div>
          {/* Progress bar */}
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-hot to-amber-400 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {activeIndex + 1} / {top5.length}
          </span>
        </div>
      </div>
    </section>
  );
}

function HourWishlistButton({ deal }: { deal: DealWithStore }) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(deal.dealID));
  return (
    <button
      type="button"
      onClick={() =>
        toggle({
          dealID: deal.dealID,
          gameID: deal.gameID,
          title: deal.title,
          thumb: deal.thumb,
          salePrice: deal.salePrice,
          normalPrice: deal.normalPrice,
          savings: deal.savings,
          storeName: deal.store?.storeName,
          storeID: deal.storeID,
        })
      }
      className={cn(
        'grid size-9 place-items-center rounded-full border backdrop-blur-md transition-all hover:scale-110',
        has
          ? 'border-primary/50 bg-primary/20 text-primary'
          : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
      )}
      aria-label={has ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={has}
    >
      <Heart className={cn('size-4', has && 'scale-110 fill-primary')} />
    </button>
  );
}
