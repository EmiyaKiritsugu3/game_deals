'use client';

import { ArrowRight, ChevronRight, Crown, Flame, Gamepad2, Gem, Heart } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface DealCollectionsProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

interface Collection {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  /** Gradient classes for the ribbon + accent */
  accent: string;
  /** Glow color for the card border */
  glow: string;
  /** Predicate to filter deals into this collection */
  filter: (d: DealWithStore) => boolean;
}

const COLLECTIONS: Collection[] = [
  {
    key: 'under-5-gems',
    title: 'Under $5 Gems',
    subtitle: "Hidden treasures that won't break the bank",
    icon: Gem,
    accent: 'from-emerald-500/80 to-primary/60',
    glow: 'oklch(0.78 0.2 145 / 0.4)',
    filter: (d) => !d.isFree && d.salePriceNum > 0 && d.salePriceNum <= 5 && d.dealRatingNum >= 7,
  },
  {
    key: 'aaa-steals',
    title: 'AAA Steals',
    subtitle: 'Blockbuster hits at indie prices',
    icon: Crown,
    accent: 'from-amber-400/80 to-hot/60',
    glow: 'oklch(0.78 0.16 70 / 0.4)',
    filter: (d) => d.savingsNum >= 80 && d.dealRatingNum >= 8,
  },
  {
    key: 'indie-darlings',
    title: 'Indie Darlings',
    subtitle: 'Critically-acclaimed smaller games',
    icon: Flame,
    accent: 'from-fuchsia-500/80 to-purple-500/60',
    glow: 'oklch(0.7 0.2 300 / 0.4)',
    filter: (d) => d.metacriticScoreNum >= 80 && d.salePriceNum <= 20 && d.dealRatingNum >= 7,
  },
  {
    key: 'weekend-coop',
    title: 'Weekend Co-op',
    subtitle: 'Top-rated picks for playing with friends',
    icon: Gamepad2,
    accent: 'from-cyan-500/80 to-primary/60',
    glow: 'oklch(0.7 0.2 200 / 0.4)',
    filter: (d) => d.steamRatingNum >= 80 && d.dealRatingNum >= 8 && d.savingsNum >= 50,
  },
];

export function DealCollections({ deals, onOpenDetail }: DealCollectionsProps) {
  // Dedupe the input first so collections don't show the same game twice
  const deduped = React.useMemo(() => dedupeToList(deals, 60), [deals]);

  // Build collections — only show ones with at least 3 matching deals
  const visibleCollections = React.useMemo(() => {
    return COLLECTIONS.map((col) => ({
      ...col,
      items: deduped.filter(col.filter).slice(0, 6),
    })).filter((col) => col.items.length >= 3);
  }, [deduped]);

  if (visibleCollections.length === 0) return null;

  return (
    <section id="collections" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-300">
              <Gem className="size-3.5" />
              Collections
            </span>
            <span className="text-xs text-muted-foreground">Hand-curated picks, updated live</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Browse by <span className="text-gradient-emerald">collection</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Editorial picks spanning every budget and mood — refreshed with the live deals feed.
          </p>
        </div>
      </div>

      {/* Collections grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleCollections.map((col, idx) => (
          <CollectionCard key={col.key} collection={col} index={idx} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({
  collection,
  index,
  onOpenDetail,
}: {
  collection: Collection & { items: DealWithStore[] };
  index: number;
  onOpenDetail?: (deal: DealWithStore) => void;
}) {
  const Icon = collection.icon;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeDeal = collection.items[activeIndex];

  const goToItem = (i: number) => {
    setActiveIndex((i + collection.items.length) % collection.items.length);
  };

  return (
    <article
      className="group relative overflow-hidden rounded-3xl glass lift-on-hover hover:border-primary/40"
      style={{
        animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 100}ms both`,
      }}
    >
      {/* Ambient glow that matches the collection accent */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `radial-gradient(circle, ${collection.glow}, transparent 60%)` }}
      />
      {/* Subtle grid texture */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.03]" />

      {/* Header strip with ribbon */}
      <div className="relative flex items-center gap-3 p-4 sm:p-5">
        <span
          className={cn(
            'relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg',
            collection.accent
          )}
        >
          {/* Ribbon sweep */}
          <span
            className="animate-ribbon-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3"
            style={{
              background:
                'linear-gradient(100deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
          <Icon className="size-6 relative" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold tracking-tight">{collection.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{collection.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          {collection.items.length} games
        </span>
      </div>

      {/* Active deal showcase */}
      {activeDeal && (
        <div className="relative px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex gap-4">
            {/* Cover */}
            <button
              type="button"
              onClick={() => onOpenDetail?.(activeDeal)}
              className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-card/60 transition-transform duration-500 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-28"
              aria-label={`View ${activeDeal.title} details`}
            >
              <Image
                src={activeDeal.thumb}
                alt={activeDeal.title}
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                -{Math.round(activeDeal.savingsNum)}%
              </span>
            </button>

            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col">
              <button
                type="button"
                onClick={() => onOpenDetail?.(activeDeal)}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded"
              >
                <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                  {activeDeal.title}
                </h4>
              </button>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-extrabold tracking-tight text-gradient-emerald">
                  {activeDeal.isFree ? 'FREE' : `$${activeDeal.salePrice}`}
                </span>
                {!activeDeal.isFree && activeDeal.normalPriceNum > activeDeal.salePriceNum && (
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    ${activeDeal.normalPrice}
                  </span>
                )}
              </div>
              {activeDeal.store && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  {/* biome-ignore lint/performance/noImgElement: store logos from CheapShark */}
                  <img
                    src={activeDeal.store.logoUrl}
                    alt=""
                    className="size-3 rounded-[2px] object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  {activeDeal.store.storeName}
                </p>
              )}
              {activeDeal.metacriticScoreNum > 0 && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-emerald-400">
                    {activeDeal.metacriticScoreNum}
                  </span>{' '}
                  Metacritic
                </p>
              )}

              {/* Actions */}
              <div className="mt-auto flex items-center gap-1.5 pt-2">
                <CollectionWishlistButton deal={activeDeal} />
                <a
                  href={dealRedirectUrl(activeDeal.dealID)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:brightness-110"
                >
                  Get deal
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Thumbnail dots / navigation */}
          <div className="mt-3 flex items-center gap-1.5">
            {collection.items.map((item, i) => (
              <button
                key={item.dealID}
                type="button"
                onClick={() => goToItem(i)}
                aria-label={`View ${item.title}`}
                className={cn(
                  'relative h-1.5 flex-1 overflow-hidden rounded-full transition-all',
                  i === activeIndex ? 'bg-primary' : 'bg-border/60 hover:bg-border'
                )}
              >
                {i === activeIndex && (
                  <span className="absolute inset-0 animate-pulse-soft bg-primary/40" />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToItem(activeIndex + 1)}
              className="ml-1 grid size-6 shrink-0 place-items-center rounded-md border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
              aria-label="Next game in collection"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CollectionWishlistButton({ deal }: { deal: DealWithStore }) {
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
        'grid size-8 shrink-0 place-items-center rounded-lg border transition-all',
        has
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
      )}
      aria-label={has ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={has}
    >
      <Heart className={cn('size-3.5', has && 'scale-110 fill-primary')} />
    </button>
  );
}
