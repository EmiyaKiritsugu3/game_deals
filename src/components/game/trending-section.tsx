'use client';

import { ChevronRight, Flame, Heart, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useDeals } from '@/hooks/use-game-data';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface TrendingSectionProps {
  onOpenDetail?: (deal: DealWithStore) => void;
}

/**
 * "Trending This Week" — top deals by deal rating with a high savings floor.
 * Uses a dedicated query (sortBy=deal-rating, onSale) so it's independent of
 * the main grid filters.
 */
export function TrendingSection({ onOpenDetail }: TrendingSectionProps) {
  const { data, isLoading } = useDeals({
    sortBy: 'deal-rating',
    onSale: true,
    pageSize: 60,
  });

  const trending = React.useMemo(() => {
    const list = data?.deals ?? [];
    // Trending = high deal rating AND substantial savings, freshest first.
    // Dedupe by title so we don't show the same game from multiple stores.
    return dedupeToList(list, 30)
      .filter((d) => d.dealRatingNum >= 8 && d.savingsNum >= 50)
      .sort((a, b) => b.dealRatingNum - a.dealRatingNum || b.savingsNum - a.savingsNum)
      .slice(0, 6);
  }, [data]);

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-trending-card]');
    const amount = card ? card.offsetWidth + 16 : 340;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section id="trending" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-hot/10 px-2.5 py-1 text-xs font-semibold text-hot">
              <TrendingUp className="size-3.5" />
              Trending
            </span>
            <span className="text-xs text-muted-foreground">Top-rated deals this week</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            What everyone&apos;s grabbing
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(-1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
            aria-label="Previous trending deal"
          >
            <ChevronRight className="size-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/40"
            aria-label="Next trending deal"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }, (_, i) => i).map((key) => (
            <div
              key={key}
              className="skeleton-shimmer h-44 w-[280px] shrink-0 rounded-2xl glass sm:w-[320px]"
            />
          ))}
        </div>
      ) : trending.length === 0 ? null : (
        <div
          ref={scrollerRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {trending.map((deal, i) => (
            <TrendingCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      )}
    </section>
  );
}

function TrendingCard({
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
      data-trending-card
      className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl glass lift-on-hover hover:border-hot/40 sm:w-[320px]"
      style={{
        animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 80}ms both`,
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
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-hot/10 to-primary/10">
            <Flame className="size-8 text-hot/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Rank badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-hot to-amber-500 px-2 py-1 text-[11px] font-extrabold text-black shadow-lg">
            <TrendingUp className="size-3" />#{index + 1}
          </span>
        </div>

        {/* Deal rating */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md ring-1 ring-white/10">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {deal.dealRating}
          </span>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {deal.store && (
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
              {}
              {/* biome-ignore lint/performance/noImgElement: store logos from CDN */}
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
            <span className="text-xl font-extrabold text-white tabular-nums">
              ${deal.salePrice}
            </span>
            <span className="text-xs text-white/60 line-through tabular-nums">
              ${deal.normalPrice}
            </span>
            <span className="ml-auto rounded bg-hot/80 px-1.5 py-0.5 text-[10px] font-bold text-black">
              -{Math.round(deal.savingsNum)}%
            </span>
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-hot" />
          {deal.dealRatingNum >= 9 ? 'Exceptional deal' : 'Highly rated'}
        </span>
        <div className="flex items-center gap-1.5">
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
              'grid size-8 place-items-center rounded-lg border transition-all hover:scale-110',
              has
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
            )}
            aria-label={
              has ? `Remove ${deal.title} from wishlist` : `Add ${deal.title} to wishlist`
            }
            aria-pressed={has}
          >
            <Heart className={cn('size-4', has && 'scale-110 fill-primary')} />
          </button>
          <a
            href={dealRedirectUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-hot to-amber-500 px-3 py-2 text-xs font-bold text-black shadow-md transition-all hover:brightness-110 sheen"
          >
            Get deal
          </a>
        </div>
      </div>
    </article>
  );
}
