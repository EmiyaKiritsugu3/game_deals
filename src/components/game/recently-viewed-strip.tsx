'use client';

import { ChevronRight, Clock } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import type { DealWithStore } from '@/lib/types';
import { useWishlist } from '@/store/wishlist';

interface RecentlyViewedStripProps {
  onOpenDetail?: (deal: DealWithStore) => void;
}

/**
 * Surfaces the recently-viewed games tracked in the wishlist store.
 * Only renders when the user has at least one recently-viewed item.
 */
export function RecentlyViewedStrip({ onOpenDetail }: RecentlyViewedStripProps) {
  const recentlyViewed = useWishlist((s) => s.recentlyViewed);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <Clock className="size-3.5 text-primary" />
            Recently viewed
          </span>
          <span className="text-xs text-muted-foreground">Pick up where you left off</span>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      >
        {recentlyViewed.map((item, i) => {
          const deal: DealWithStore = {
            internalName: item.title,
            title: item.title,
            metacriticLink: null,
            dealID: item.dealID,
            storeID: item.storeID ?? '',
            gameID: item.gameID,
            steamAppID: null,
            salePrice: item.salePrice,
            normalPrice: item.normalPrice,
            isOnSale: '1',
            savings: item.savings,
            metacriticScore: '0',
            steamRatingPercent: '0',
            steamRatingText: '',
            steamRatingCount: '0',
            releaseDate: 0,
            lastChange: 0,
            dealRating: '0',
            thumb: item.thumb,
            salePriceNum: Number(item.salePrice) || 0,
            normalPriceNum: Number(item.normalPrice) || 0,
            savingsNum: Number(item.savings) || 0,
            dealRatingNum: 0,
            metacriticScoreNum: 0,
            steamRatingNum: 0,
            releaseDateMs: 0,
            releaseDateLabel: '—',
            isFree: Number(item.salePrice) === 0,
          };
          return (
            <button
              key={item.dealID}
              type="button"
              onClick={() => onOpenDetail?.(deal)}
              className="group relative flex w-44 shrink-0 snap-start items-center gap-3 overflow-hidden rounded-xl glass p-2.5 text-left lift-on-hover hover:border-primary/40 sm:w-52"
              style={{
                animation: `slide-in-right 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both`,
              }}
              aria-label={`Reopen ${item.title}`}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-card/60">
                <Image
                  src={item.thumb}
                  alt={item.title}
                  fill
                  sizes="56px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {Number(item.salePrice) === 0 ? (
                    <span className="font-bold text-hot">FREE</span>
                  ) : (
                    <span className="font-semibold text-foreground">${item.salePrice}</span>
                  )}
                  {Number(item.normalPrice) > Number(item.salePrice) && (
                    <span className="ml-1 text-muted-foreground line-through">
                      ${item.normalPrice}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
