'use client';

import { ChevronRight, Flame, Gift, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { ClaimFreeCta } from '@/components/game/deal-cta';
import { Button } from '@/components/ui/button';
import { useFreeGames } from '@/hooks/use-game-data';
import { dealRedirectUrl, toWishlistPayload } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface FreeGamesSectionProps {
  onOpenDetail?: (deal: DealWithStore) => void;
}

export function FreeGamesSection({ onOpenDetail }: FreeGamesSectionProps) {
  const { data, isLoading, isError } = useFreeGames();
  // Dedupe so we don't show the same free game from multiple stores.
  const deals = React.useMemo(() => dedupeToList(data?.deals ?? [], 12), [data]);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-free-card]');
    const amount = card ? card.offsetWidth + 16 : 320;
    el.scrollBy({ left: dir * amount * 2, behavior: 'smooth' });
  };

  return (
    <section id="free" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 animated-gradient-border p-5 sm:p-7">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-40 blur-3xl animate-float-slow"
          style={{
            background: 'radial-gradient(circle, oklch(0.82 0.2 300 / 0.5), transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full opacity-35 blur-3xl animate-float-slower"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.16 70 / 0.5), transparent 60%)',
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-400">
                  <Gift className="size-3.5 animate-heartbeat" />
                  100% Off
                </span>
                <span className="text-xs text-muted-foreground">
                  Claim these before they&apos;re gone
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="text-free-shimmer">Free games</span> right now
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {deals.length > 0
                  ? `${deals.length} titles currently free to claim.`
                  : 'Loading the latest giveaways…'}
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(-1)}
                className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
                aria-label="Previous free game"
              >
                <ChevronRight className="size-4 rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(1)}
                className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
                aria-label="Next free game"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Scroller */}
          {isLoading ? (
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div /* biome-ignore lint/suspicious/noArrayIndexKey: static skeleton */
                  key={`skeleton-${i}`}
                  className="skeleton-shimmer h-52 w-[280px] shrink-0 rounded-2xl bg-card/60 sm:w-[320px]"
                />
              ))}
            </div>
          ) : isError || !deals.length ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border/50 py-12 text-center">
              <Gift className="size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No free games right now</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check back soon — new giveaways appear every week.
              </p>
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
            >
              {deals.map((deal, i) => (
                <FreeGameCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FreeGameCard({
  deal,
  index,
  onOpenDetail,
}: {
  deal: DealWithStore;
  index: number;
  onOpenDetail?: (deal: DealWithStore) => void;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(deal.dealID));
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <article
      data-free-card
      className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl glass conic-border lift-on-hover hover:border-fuchsia-400/40 sm:w-[320px]"
      style={{
        animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 70}ms both`,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-card/60"
        aria-label={`View ${deal.title} details`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="320px"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-fuchsia-500/10 to-amber-500/10">
            <Gift className="size-8 text-fuchsia-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* FREE ribbon */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-fuchsia-500 via-amber-400 to-emerald-400 px-3 py-1.5 text-sm font-extrabold text-black shadow-lg animate-gradient-pan">
            <Gift className="size-4" />
            FREE
          </span>
        </div>

        {/* Savings meta */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-fuchsia-300 backdrop-blur-md ring-1 ring-white/10">
            <Sparkles className="size-3" />
            100% OFF
          </span>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {deal.store && (
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
              {}
              {/* biome-ignore lint/performance/noImgElement: store logos from CheapShark */}
              <img
                src={deal.store.logoUrl}
                alt=""
                className="size-3.5 rounded-[3px] object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              {deal.store.storeName}
            </span>
          )}
          <h3 className="line-clamp-1 text-lg font-bold text-white drop-shadow">{deal.title}</h3>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-free-shimmer">$0.00</span>
            {deal.normalPriceNum > 0 && (
              <span className="text-xs text-white/60 line-through tabular-nums">
                ${deal.normalPrice}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-fuchsia-400" />
          Limited time
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggle(toWishlistPayload(deal))}
            className={cn(
              'grid size-8 place-items-center rounded-lg border transition-all hover:scale-110',
              has
                ? 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-300'
                : 'border-border/50 bg-card/40 text-muted-foreground hover:border-fuchsia-400/50 hover:text-fuchsia-300'
            )}
            aria-label={
              has ? `Remove ${deal.title} from wishlist` : `Add ${deal.title} to wishlist`
            }
            aria-pressed={has}
          >
            <Heart className={cn('size-4', has && 'scale-110 fill-fuchsia-400')} />
          </button>
          <ClaimFreeCta href={dealRedirectUrl(deal.dealID)} size="sm" label="Claim" />
        </div>
      </div>
    </article>
  );
}
