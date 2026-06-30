'use client';

import { Clock, Crown, Flame, Heart, Sparkles, Star, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { GrabDealCta } from '@/components/game/deal-cta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

interface DealOfTheDayProps {
  deals: DealWithStore[];
  onOpenDetail?: (deal: DealWithStore) => void;
}

function useCountdown(targetMs: number) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, total: diff };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function DealOfTheDay({ deals, onOpenDetail }: DealOfTheDayProps) {
  // Pick the "deal of the day" deterministically: highest dealRating * savings
  // Using a stable seed based on the day so it doesn't flicker on every render.
  const deal = React.useMemo(() => {
    if (!deals.length) return null;
    // Dedupe candidates so we don't pick a variant of an already-shown game.
    const pool = dedupeToList(deals, 30);
    const scored = pool.map((d) => ({
      d,
      score: d.dealRatingNum * d.savingsNum + d.metacriticScoreNum / 10,
    }));
    scored.sort((a, b) => b.score - a.score);
    // Deterministic pick based on day-of-year so it's stable for the session
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const idx = dayOfYear % Math.min(scored.length, 5);
    return scored[idx].d;
  }, [deals]);

  // Countdown to end of day (local time)
  const endOfDay = React.useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const countdown = useCountdown(endOfDay);

  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => (deal ? s.has(deal.dealID) : false));
  const [imgOk, setImgOk] = React.useState(true);

  if (!deal) return null;

  return (
    <section id="deal-of-day" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-hot/30 animated-gradient-border">
        {/* Ambient spotlight sweep */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 30% 50%, oklch(0.78 0.16 70 / 0.25), transparent 70%)',
          }}
        />
        <div
          className="animate-spotlight-sweep pointer-events-none absolute -inset-y-10 left-0 w-1/3 opacity-30 blur-3xl"
          style={{
            background:
              'linear-gradient(100deg, transparent, oklch(0.85 0.2 150 / 0.4), transparent)',
          }}
        />

        <div className="relative grid gap-0 md:grid-cols-2">
          {/* Left: cover */}
          <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
            <button
              type="button"
              onClick={() => onOpenDetail?.(deal)}
              className="absolute inset-0 size-full"
              aria-label={`View ${deal.title} details`}
            >
              {imgOk ? (
                <Image
                  src={deal.thumb}
                  alt={deal.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105"
                  onError={() => setImgOk(false)}
                  unoptimized
                  priority
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-hot/20 to-primary/10">
                  <Crown className="size-12 text-hot/50" />
                </div>
              )}
            </button>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r" />

            {/* Crown badge */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 via-hot to-amber-500 px-3 py-1.5 text-sm font-extrabold text-black shadow-xl">
                <Crown className="size-4" />
                Deal of the Day
              </span>
              {deal.savingsNum >= 50 && (
                <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md ring-1 ring-white/10">
                  <Flame className="size-3" />
                  {Math.round(deal.savingsNum)}% off
                </span>
              )}
            </div>

            {/* Countdown overlay (bottom-left of cover) */}
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-md ring-1 ring-white/10">
                <Clock className="size-4 text-amber-300" />
                <div className="flex items-center gap-1 font-mono text-sm font-bold tabular-nums text-white">
                  <CountdownDigit value={countdown.hours} label="h" />
                  <span className="text-amber-300/60">:</span>
                  <CountdownDigit value={countdown.minutes} label="m" />
                  <span className="text-amber-300/60">:</span>
                  <CountdownDigit value={countdown.seconds} label="s" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-hot/10 px-2.5 py-1 text-xs font-semibold text-hot">
                  <Sparkles className="size-3.5" />
                  Editor&apos;s pick
                </span>
                {deal.store && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-xs font-medium backdrop-blur-md">
                    {}
                    <img
                      src={deal.store.logoUrl}
                      alt=""
                      className="size-3.5 rounded-[3px] object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {deal.store.storeName}
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {deal.title}
              </h2>

              {/* Ratings */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {deal.dealRatingNum > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-mono text-sm font-bold">{deal.dealRating}</span>
                    <span className="text-xs text-muted-foreground">deal rating</span>
                  </div>
                )}
                {deal.metacriticScoreNum > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  >
                    <TrendingDown className="size-3" />
                    {deal.metacriticScoreNum} Metacritic
                  </Badge>
                )}
                {deal.steamRatingText && (
                  <span className="text-xs text-muted-foreground">{deal.steamRatingText}</span>
                )}
              </div>
            </div>

            {/* Price block */}
            <div className="flex items-end gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s price
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-gradient-emerald sm:text-5xl">
                    {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
                  </span>
                  {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
                    <span className="text-lg text-muted-foreground line-through tabular-nums">
                      ${deal.normalPrice}
                    </span>
                  )}
                </div>
              </div>
              {!deal.isFree && deal.savingsNum > 0 && (
                <div className="pb-1">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-hot/15 px-2 py-1 text-sm font-bold text-hot">
                    <TrendingDown className="size-3.5" />
                    Save {Math.round(deal.savingsNum)}%
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <GrabDealCta href={dealRedirectUrl(deal.dealID)} size="lg" label="Grab this deal" />
              <Button
                variant="outline"
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
                  'gap-2 rounded-full border-border/50 bg-card/40 backdrop-blur-md transition-all hover:border-primary/40',
                  has && 'border-primary/40 bg-primary/10 text-primary'
                )}
              >
                <Heart className={cn('size-4', has && 'fill-primary')} />
                {has ? 'Wishlisted' : 'Wishlist'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenDetail?.(deal)}
                className="text-muted-foreground hover:text-foreground"
              >
                View details
              </Button>
            </div>

            {/* Urgency hint */}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-hot opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-hot" />
              </span>
              Offer resets at midnight —{' '}
              {countdown.total > 0
                ? `${pad(countdown.hours)}h ${pad(countdown.minutes)}m ${pad(countdown.seconds)}s left`
                : 'ending soon'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  // Re-mount on value change to trigger the digit-flip animation
  const key = `${value}-${label}`;
  return (
    <span key={key} className="inline-flex items-baseline animate-digit-flip">
      <span className="tabular-nums">{pad(value)}</span>
      <span className="ml-0.5 text-[9px] font-normal text-amber-300/60">{label}</span>
    </span>
  );
}
