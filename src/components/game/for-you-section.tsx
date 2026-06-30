'use client';

import { ArrowRight, Heart, Sparkles, Star, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { dedupeToList, dedupKey } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useWishlist } from '@/store/wishlist';

interface ForYouSectionProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

/**
 * Personalized "For You" section — only renders when the user is signed in
 * AND has at least one wishlisted or recently-viewed game.
 *
 * Recommendation logic:
 *  1. Collect wishlisted + recently-viewed game IDs as "seed" preferences.
 *  2. From the loaded deals, exclude the seeds themselves.
 *  3. Prefer deals with similar characteristics to the seeds:
 *     - Same store (weight 2)
 *     - Similar savings tier (weight 1)
 *     - High deal rating (weight 1 per point above 8)
 *  4. Take top 8 by score, deduplicated.
 */
export function ForYouSection({ deals, onOpenDetail }: ForYouSectionProps) {
  const user = useAuth((s) => s.user);
  const wishlistItems = useWishlist((s) => s.items);
  const recentlyViewed = useWishlist((s) => s.recentlyViewed);

  const recommendations = React.useMemo(() => {
    if (!user || (wishlistItems.length === 0 && recentlyViewed.length === 0)) return [];

    // Build seed preference set
    const seedStoreIds = new Set<string>();
    const seedKeys = new Set<string>();
    const seedSavingsTiers = new Set<number>(); // rounded to nearest 10
    for (const item of [...wishlistItems, ...recentlyViewed]) {
      if (item.storeID) seedStoreIds.add(item.storeID);
      const savings = Number(item.savings) || 0;
      seedSavingsTiers.add(Math.round(savings / 10) * 10);
      // Use gameID as a seed key for dedup
      seedKeys.add(dedupKey({ steamAppID: null, title: item.title, gameID: item.gameID }));
    }

    // Score each deal
    const scored = deals
      .filter((d) => {
        // Exclude seeds themselves (don't recommend what's already wishlisted)
        const key = dedupKey(d);
        return !seedKeys.has(key);
      })
      .map((d) => {
        let score = 0;
        if (d.storeID && seedStoreIds.has(d.storeID)) score += 2;
        const tier = Math.round(d.savingsNum / 10) * 10;
        if (seedSavingsTiers.has(tier)) score += 1;
        if (d.dealRatingNum > 8) score += d.dealRatingNum - 8;
        if (d.metacriticScoreNum >= 80) score += 1;
        if (d.savingsNum >= 70) score += 1; // bonus for big savings
        return { deal: d, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return dedupeToList(
      scored.map((s) => s.deal),
      8
    ).slice(0, 8);
  }, [user, wishlistItems, recentlyViewed, deals]);

  // Don't render if not signed in or no recommendations
  if (!user || recommendations.length < 3) return null;

  const firstName = user.name.split(' ')[0];

  return (
    <section id="for-you" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5 animate-heartbeat" />
              For you
            </span>
            <span className="text-xs text-muted-foreground">
              Personalized picks based on your wishlist
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Picked for <span className="text-gradient-emerald">{firstName}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Games similar to ones you&apos;ve saved — matched by store, savings tier, and rating.
          </p>
        </div>
      </div>

      {/* Recommendation grid — horizontal scroll on mobile, grid on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {recommendations.map((deal, i) => (
          <ForYouCard key={deal.dealID} deal={deal} index={i} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

function ForYouCard({
  deal,
  index,
  onOpenDetail,
}: {
  deal: DealWithStore;
  index: number;
  onOpenDetail?: (deal: DealWithStore) => void;
}) {
  const [imgOk, setImgOk] = React.useState(true);
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl glass lift-on-hover hover:border-primary/40"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both`,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative block aspect-[460/215] w-full overflow-hidden bg-card/60"
        aria-label={`View ${deal.title} details`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-card to-muted">
            <Heart className="size-6 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Savings badge */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          <TrendingDown className="size-2.5" />-{Math.round(deal.savingsNum)}%
        </span>

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <h3 className="line-clamp-1 text-xs font-semibold text-white drop-shadow">
            {deal.title}
          </h3>
          {deal.dealRatingNum > 0 && (
            <div className="mt-0.5 flex items-center gap-1">
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-300">{deal.dealRating}</span>
            </div>
          )}
        </div>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <span className="text-sm font-extrabold tracking-tight text-gradient-emerald">
            {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
          </span>
          {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
            <span className="ml-1 text-[10px] text-muted-foreground line-through tabular-nums">
              ${deal.normalPrice}
            </span>
          )}
        </div>
        <a
          href={`https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(deal.dealID)}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary transition-all hover:bg-primary/30"
          aria-label={`Get ${deal.title} deal`}
        >
          <ArrowRight className="size-3.5" />
        </a>
      </div>
    </article>
  );
}
