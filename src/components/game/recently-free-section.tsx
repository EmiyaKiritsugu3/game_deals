'use client';

import { ChevronRight, Clock, ExternalLink, Gift, Heart, History } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { dealRedirectUrl, enrichStore, normaliseDeal } from '@/lib/deal-utils';
import { FALLBACK_DEALS, FALLBACK_STORES } from '@/lib/fallback';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface RecentlyFreeSectionProps {
  onOpenDetail?: (deal: DealWithStore) => void;
}

/**
 * "Recently Free" archive — since CheapShark's live `upperPrice=0` endpoint
 * often returns only 1-2 titles at a time, this section surfaces a curated
 * archive of notable games that have been free in the past (from the fallback
 * dataset), giving users a richer free-games experience year-round.
 */
export function RecentlyFreeSection({ onOpenDetail }: RecentlyFreeSectionProps) {
  const archive = React.useMemo<DealWithStore[]>(() => {
    const storeMap = new Map(FALLBACK_STORES.map((s) => [s.storeID, enrichStore(s)]));
    return FALLBACK_DEALS.map((d) => normaliseDeal(d, storeMap.get(d.storeID)))
      .filter((d) => d.isFree || d.savingsNum >= 90)
      .slice(0, 8);
  }, []);

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-rfree-card]');
    const amount = card ? card.offsetWidth + 16 : 300;
    el.scrollBy({ left: dir * amount * 2, behavior: 'smooth' });
  };

  if (archive.length === 0) return null;

  return (
    <section
      id="recently-free"
      className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-400">
              <History className="size-3.5" />
              Archive
            </span>
            <span className="text-xs text-muted-foreground">Notable games that were free</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Recently free archive
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Missed a giveaway? These have been free before — keep an eye out for the next drop.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(-1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-fuchsia-400/40"
            aria-label="Previous archived free game"
          >
            <ChevronRight className="size-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy(1)}
            className="size-9 rounded-full border-border/50 bg-card/40 backdrop-blur-md hover:border-fuchsia-400/40"
            aria-label="Next archived free game"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {archive.map((deal, i) => (
          <ArchiveCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

function ArchiveCard({
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
      data-rfree-card
      className="group relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl glass lift-on-hover hover:border-fuchsia-400/30 sm:w-[290px]"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 70}ms both`,
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
            sizes="290px"
            className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-fuchsia-500/10 to-amber-500/10">
            <Gift className="size-8 text-fuchsia-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* "Was free" badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-fuchsia-300 backdrop-blur-md ring-1 ring-white/10">
            <Clock className="size-3" />
            Was free
          </span>
        </div>

        {/* Savings badge */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-500/20 px-2 py-1 text-[10px] font-bold text-fuchsia-300 backdrop-blur-md ring-1 ring-fuchsia-400/20">
            -{Math.round(deal.savingsNum)}%
          </span>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          {deal.store && (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
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
          <h3 className="line-clamp-1 text-base font-bold text-white drop-shadow">{deal.title}</h3>
        </div>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Now</p>
          <p className="font-mono text-sm font-bold">
            {deal.isFree ? (
              <span className="text-gradient-emerald">FREE</span>
            ) : (
              <span>${deal.salePrice}</span>
            )}
          </p>
        </div>
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
          <a
            href={dealRedirectUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-fuchsia-400/50 hover:text-fuchsia-300"
            aria-label={`Open ${deal.title} deal (external)`}
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

