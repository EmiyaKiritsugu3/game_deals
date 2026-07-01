'use client';

import { ChevronLeft, ChevronRight, Flame, Heart, Star, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { GetDealCta } from '@/components/game/deal-cta';
import { Button } from '@/components/ui/button';
import { dealRedirectUrl, toWishlistPayload } from '@/lib/deal-utils';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface FeaturedDealsProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

export function FeaturedDeals({ deals, onOpenDetail }: FeaturedDealsProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-feature-card]');
    const amount = card ? card.offsetWidth + 16 : 360;
    el.scrollBy({ left: dir * amount * 2, behavior: 'smooth' });
  };

  if (!deals.length) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(() => {
          const keys = Array.from({ length: 3 }, (_, i) => `skeleton-${i}`);
          return keys.map((key) => (
            <div key={key} className="h-64 skeleton-shimmer rounded-2xl glass" />
          ));
        })()}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-hot/10 px-2.5 py-1 text-xs font-semibold text-hot">
              <Flame className="size-3.5" />
              Featured
            </span>
            <span className="text-xs text-muted-foreground">Hand-picked deals of the day</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Editor&apos;s choice deals
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(-1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {deals.map((deal, i) => (
          <FeaturedCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({
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
      data-feature-card
      className="group relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl glass conic-border lift-on-hover hover:border-primary/40 sm:w-[340px]"
      style={{
        animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 80}ms both`,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-card/60"
        aria-label={`View ${deal.title}`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="340px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-card to-muted">
            <Flame className="size-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

        {/* Big discount ribbon */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-hot to-amber-500 px-3 py-1.5 text-base font-extrabold text-black shadow-lg">
            <TrendingDown className="size-4" />-{Math.round(deal.savingsNum)}%
          </span>
        </div>

        {/* Title + meta overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {deal.store && (
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
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
          {deal.dealRatingNum > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">{deal.dealRating}</span>
              <span className="text-xs text-white/70">deal rating</span>
            </div>
          )}
        </div>
      </button>

      {/* Wishlist — sibling (not nested) to avoid invalid <button> in <button> */}
      <button
        type="button"
        onClick={() => toggle(toWishlistPayload(deal))}
        className={cn(
          'absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full border backdrop-blur-md transition-all hover:scale-110',
          has
            ? 'border-primary/50 bg-primary/30 text-primary'
            : 'border-white/20 bg-black/40 text-white hover:border-primary/50 hover:text-primary'
        )}
        aria-label={has ? `Remove ${deal.title} from wishlist` : `Add ${deal.title} to wishlist`}
        aria-pressed={has}
      >
        <Heart className={cn('size-4', has && 'scale-110 fill-primary')} />
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-gradient-emerald">
              {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
            </span>
            {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
              <span className="text-xs text-muted-foreground line-through tabular-nums">
                ${deal.normalPrice}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {deal.isFree
              ? '100% off — claim now'
              : `Save $${(deal.normalPriceNum - deal.salePriceNum).toFixed(2)}`}
          </p>
        </div>
        <GetDealCta href={dealRedirectUrl(deal.dealID)} size="sm" label="Get deal" />
      </div>
    </article>
  );
}
