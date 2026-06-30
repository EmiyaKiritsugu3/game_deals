'use client';

import { Crown, ExternalLink, Heart, Medal, TrendingDown, Trophy } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface SavingsLeaderboardProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

const RANK_STYLES = [
  {
    icon: Crown,
    cls: 'from-amber-400 to-amber-500 text-black',
    ring: 'ring-amber-400/40',
    label: 'Gold',
  },
  {
    icon: Medal,
    cls: 'from-zinc-300 to-zinc-400 text-black',
    ring: 'ring-zinc-300/40',
    label: 'Silver',
  },
  {
    icon: Medal,
    cls: 'from-amber-700 to-amber-800 text-white',
    ring: 'ring-amber-700/40',
    label: 'Bronze',
  },
];

export function SavingsLeaderboard({ deals, onOpenDetail }: SavingsLeaderboardProps) {
  const top5 = React.useMemo(() => {
    // Dedupe first so the leaderboard shows 5 distinct games, not 5 variants
    // of the same title from different stores.
    return dedupeToList(deals, 30)
      .sort((a, b) => b.savingsNum - a.savingsNum)
      .slice(0, 5);
  }, [deals]);

  if (top5.length === 0) return null;

  const maxSavings = top5[0]?.savingsNum || 100;

  return (
    <section id="leaderboard" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <Trophy className="size-3.5" />
            Leaderboard
          </span>
          <span className="text-xs text-muted-foreground">Biggest discounts right now</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Top 5 savers</h2>
      </div>

      <div className="space-y-2.5">
        {top5.map((deal, i) => (
          <LeaderboardRow
            key={deal.dealID}
            deal={deal}
            rank={i}
            maxSavings={maxSavings}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </section>
  );
}

function LeaderboardRow({
  deal,
  rank,
  maxSavings,
  onOpenDetail,
}: {
  deal: DealWithStore;
  rank: number;
  maxSavings: number;
  onOpenDetail?: (deal: DealWithStore) => void;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(deal.dealID));
  const [imgOk, setImgOk] = React.useState(true);
  const style = RANK_STYLES[rank] ?? RANK_STYLES[2];
  const RankIcon = style.icon;
  const barWidth = Math.max(8, (deal.savingsNum / maxSavings) * 100);

  return (
    <div
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl glass p-3 lift-on-hover hover:border-primary/30 sm:gap-4 sm:p-4"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) ${rank * 80}ms both`,
      }}
    >
      {/* Rank badge */}
      <div className="relative shrink-0">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl bg-gradient-to-br shadow-lg sm:size-12',
            style.cls,
            style.ring,
            'ring-2'
          )}
        >
          <RankIcon className="size-5 sm:size-6" />
        </span>
        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-card text-[10px] font-bold ring-1 ring-border/50">
          {rank + 1}
        </span>
      </div>

      {/* Cover */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(deal)}
        className="relative hidden h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-card/60 sm:block"
        aria-label={`View ${deal.title}`}
      >
        {imgOk ? (
          <Image
            src={deal.thumb}
            alt={deal.title}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgOk(false)}
            unoptimized
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-card to-muted">
            <TrendingDown className="size-4 text-muted-foreground/40" />
          </div>
        )}
      </button>

      {/* Title + store */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpenDetail?.(deal)}
          className="block w-full text-left"
        >
          <p className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary sm:text-base">
            {deal.title}
          </p>
        </button>
        <div className="mt-0.5 flex items-center gap-2">
          {deal.store && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {}
              <img
                src={deal.store.logoUrl}
                alt=""
                className="size-3 rounded-[2px] object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              {deal.store.storeName}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">•</span>
          <span className="text-[11px] text-muted-foreground">
            {deal.isFree ? 'Free' : `$${deal.salePrice}`}
          </span>
        </div>

        {/* Savings progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-card/60">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full animate-bar-glow',
                rank === 0
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : rank === 1
                    ? 'bg-gradient-to-r from-zinc-300 to-zinc-400'
                    : rank === 2
                      ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                      : 'bg-gradient-to-r from-primary/60 to-primary'
              )}
              style={{ width: `${barWidth}%`, animationDelay: `${rank * 80 + 200}ms` }}
            />
          </div>
          <span
            className={cn(
              'shrink-0 font-mono text-sm font-bold tabular-nums',
              rank < 3 ? 'text-amber-400' : 'text-primary'
            )}
          >
            -{Math.round(deal.savingsNum)}%
          </span>
        </div>
      </div>

      {/* Price + actions */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="font-mono text-lg font-bold tabular-nums text-gradient-emerald">
            {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
          </p>
          {!deal.isFree && (
            <p className="font-mono text-xs text-muted-foreground line-through tabular-nums">
              ${deal.normalPrice}
            </p>
          )}
        </div>
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
              ? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
          )}
          aria-label={has ? `Remove ${deal.title} from wishlist` : `Add ${deal.title} to wishlist`}
          aria-pressed={has}
        >
          <Heart className={cn('size-4', has && 'scale-110 fill-primary')} />
        </button>
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
  );
}
