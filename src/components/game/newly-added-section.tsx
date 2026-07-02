'use client';

import { ChevronLeft, ChevronRight, Clock, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useNewlyAdded } from '@/hooks/use-game-data';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface NewlyAddedSectionProps {
  onOpenDetail?: (deal: DealWithStore) => void;
}

export function NewlyAddedSection({ onOpenDetail }: NewlyAddedSectionProps) {
  const query = useNewlyAdded();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const deals = React.useMemo(() => {
    // Dedupe: one card per game (cheapest variant).
    // Keep only games released in the last ~2 years so the section
    // actually feels "newly added".
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 365 * 2;
    const recent = (query.data?.deals ?? []).filter(
      (d) => d.releaseDateMs > 0 && d.releaseDateMs >= cutoff
    );
    return dedupeToList(recent, 12).slice(0, 10);
  }, [query.data]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-new-card]');
    const amount = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * amount * 2, behavior: 'smooth' });
  };

  return (
    <section id="newly-added" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-hot/10 px-2.5 py-1 text-xs font-semibold text-hot">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-hot opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-hot" />
              </span>
              NEW
            </span>
            <span className="text-xs text-muted-foreground">Fresh releases now on sale</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Newly added deals</h2>
          <p className="mt-1 text-sm text-muted-foreground/90">
            Games released in the last 2 years — sorted by release date.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(-1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-hot/40"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-hot/40"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div /* biome-ignore lint/suspicious/noArrayIndexKey: static skeleton */
              key={`skeleton-${i}`}
              className="skeleton-shimmer h-44 w-[260px] shrink-0 rounded-2xl glass"
            />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 py-12 text-center text-sm text-muted-foreground">
          <Sparkles className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2">No recently-released games on sale right now.</p>
          <p className="text-xs">Check back later — new deals drop every few minutes.</p>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {deals.map((deal, i) => (
            <NewlyAddedCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      )}
    </section>
  );
}

function NewlyAddedCard({
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
  const releaseYear = deal.releaseDateMs ? new Date(deal.releaseDateMs).getFullYear() : null;

  return (
    <article
      data-new-card
      className="group relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl glass lift-on-hover hover:border-hot/40 sm:w-[280px]"
      style={{
        animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both`,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-card/60"
        aria-label={`View ${deal.title} details`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="280px"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-hot/10 to-amber-400/10">
            <Sparkles className="size-8 text-hot/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* NEW badge with pulsing dot */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-hot to-amber-400 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-lg animate-new-pulse">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-black/60 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-black" />
            </span>
            NEW
          </span>
          {deal.savingsNum >= 50 && (
            <span className="inline-flex items-center rounded-lg bg-black/60 px-1.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md ring-1 ring-white/10">
              -{Math.round(deal.savingsNum)}%
            </span>
          )}
        </div>

        {/* Release year + store chip */}
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
          {releaseYear && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md ring-1 ring-white/10">
              <Clock className="size-2.5" />
              {releaseYear}
            </span>
          )}
          {deal.store && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
              {/* biome-ignore lint/performance/noImgElement: store logos from CheapShark */}
              <img
                src={deal.store.logoUrl}
                alt=""
                className="size-3 rounded-[2px] object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              {deal.store.storeName}
            </span>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-white drop-shadow">{deal.title}</h3>
          {deal.dealRatingNum > 0 && (
            <p className="mt-0.5 text-[10px] font-medium text-white/80">
              Deal rating {deal.dealRating}
            </p>
          )}
        </div>
      </button>

      {/* Footer: price + actions */}
      <div className="flex items-center justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold tracking-tight text-gradient-emerald">
              {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
            </span>
            {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
              <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                ${deal.normalPrice}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {deal.isFree
              ? '100% off — claim now'
              : `Save $${(deal.normalPriceNum - deal.salePriceNum).toFixed(2)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
              'grid size-7 place-items-center rounded-lg border transition-all',
              has
                ? 'border-hot/50 bg-hot/15 text-hot'
                : 'border-border/50 bg-card/40 text-muted-foreground hover:border-hot/40 hover:text-hot'
            )}
            aria-label={
              has ? `Remove ${deal.title} from wishlist` : `Add ${deal.title} to wishlist`
            }
            aria-pressed={has}
          >
            <Heart className={cn('size-3.5', has && 'scale-110 fill-hot')} />
          </button>
          <a
            href={dealRedirectUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:brightness-110"
            aria-label={`Open ${deal.title} deal (external)`}
          >
            Get
          </a>
        </div>
      </div>
    </article>
  );
}
