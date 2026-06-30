'use client';

import {
  Activity,
  ExternalLink,
  Heart,
  History,
  Loader2,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  Tag,
  TrendingDown,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { GetDealCta } from '@/components/game/deal-cta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameDetail } from '@/hooks/use-game-data';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { isOfficialRetailer } from '@/lib/store-trust';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';
import { PriceSparkline, type SparklinePoint } from './price-sparkline';

interface GameDetailDialogProps {
  deal: DealWithStore | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface DealEntry {
  dealID: string;
  storeID: string;
  price: string;
  retailPrice: string;
  savings: string;
  store?: { storeName: string; logoUrl: string };
  priceNum: number;
  retailPriceNum: number;
  savingsNum: number;
  redirectUrl: string;
}

export function GameDetailDialog({ deal, open, onOpenChange }: GameDetailDialogProps) {
  const { data, isLoading, isError } = useGameDetail(deal?.gameID ?? null) as {
    data: any;
    isLoading: boolean;
    isError: boolean;
  };
  const addRecentlyViewed = useWishlist((s) => s.addRecentlyViewed);

  React.useEffect(() => {
    if (deal && open) {
      addRecentlyViewed({
        dealID: deal.dealID,
        gameID: deal.gameID,
        title: deal.title,
        thumb: deal.thumb,
        salePrice: deal.salePrice,
        normalPrice: deal.normalPrice,
        savings: deal.savings,
        storeName: deal.store?.storeName,
        storeID: deal.storeID,
      });
    }
  }, [
    deal?.dealID,
    open,
    deal.thumb,
    deal.storeID,
    deal.salePrice,
    deal.title,
    deal.normalPrice,
    addRecentlyViewed,
    deal.savings,
    deal.store?.storeName,
    deal.gameID,
    deal,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border-border/60 bg-card/80 p-0 backdrop-blur-2xl sm:max-w-3xl">
        {deal && (
          <>
            {/* Hero banner */}
            <div className="relative aspect-[16/7] w-full overflow-hidden bg-card/60">
              <Image
                src={deal.thumb}
                alt={deal.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {deal.store && (
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
                        {}
                        <img
                          src={deal.store.logoUrl}
                          alt=""
                          className="size-3.5 rounded-[3px] object-contain"
                        />
                        {deal.store.storeName}
                      </span>
                    )}
                    <DialogTitle className="line-clamp-2 text-xl font-bold text-white drop-shadow sm:text-2xl">
                      {deal.title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Deal details, price history, and store comparison for {deal.title}.
                    </DialogDescription>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-baseline gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-md">
                      <span className="text-2xl font-extrabold text-gradient-emerald">
                        {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
                      </span>
                      {!deal.isFree && (
                        <span className="text-xs text-white/70 line-through">
                          ${deal.normalPrice}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-white/80">
                      -{Math.round(deal.savingsNum)}% off
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5 sm:p-6">
              {/* Quick action row */}
              <div className="flex flex-wrap items-center gap-2">
                <GetDealCta href={dealRedirectUrl(deal.dealID)} size="md" label="Get this deal" />
                <WishlistButton deal={deal} />
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {deal.metacriticScoreNum > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    >
                      <Star className="size-3 fill-emerald-400" />
                      {deal.metacriticScoreNum} Metacritic
                    </Badge>
                  )}
                  {deal.steamRatingText && (
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                      {deal.steamRatingText}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Tag className="size-3" />
                    Released {deal.releaseDateLabel}
                  </Badge>
                </div>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              )}

              {isError && !isLoading && (
                <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Couldn&apos;t load the full price comparison right now. Try the direct deal link
                  above.
                </div>
              )}

              {/* Cheapest ever + Price history sparkline */}
              {data?.cheapestPriceEver && (
                <PriceHistoryCard
                  cheapestEver={Number(data.cheapestPriceEver.price) || 0}
                  cheapestEverDate={data.cheapestPriceEver.date * 1000}
                  currentPrice={deal.salePriceNum}
                  retailPrice={deal.normalPriceNum}
                  storeDeals={(data.deals as DealEntry[] | undefined) ?? []}
                />
              )}

              {/* Store comparison */}
              {data?.deals?.length ? (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <StoreIcon className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold">Compare {data.deals.length} stores</h3>
                  </div>
                  <div className="space-y-2">
                    {[...(data.deals as DealEntry[])]
                      .sort((a, b) => a.priceNum - b.priceNum)
                      .map((d, i) => {
                        const isCheapest = i === 0;
                        return (
                          <div
                            key={d.dealID}
                            className={cn(
                              'group flex items-center gap-3 rounded-xl border p-3 transition-all',
                              isCheapest
                                ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/10'
                                : 'border-border/40 bg-card/30 hover:border-primary/30 hover:bg-accent/20'
                            )}
                          >
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border/50 bg-card/50">
                              {d.store?.logoUrl ? (
                                <img
                                  src={d.store.logoUrl}
                                  alt=""
                                  className="size-6 rounded object-contain"
                                />
                              ) : (
                                <StoreIcon className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                                <span className="truncate">
                                  {d.store?.storeName ?? `Store ${d.storeID}`}
                                </span>
                                {isOfficialRetailer(d.storeID) && (
                                  <span
                                    className="inline-flex shrink-0 items-center gap-0.5 rounded border border-primary/40 bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary"
                                    title="Official retailer — publisher-authorized keys"
                                  >
                                    <ShieldCheck className="size-2.5" />
                                    Verified
                                  </span>
                                )}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                {d.retailPriceNum > d.priceNum && (
                                  <span className="line-through">${d.retailPrice}</span>
                                )}
                                {d.savingsNum > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-primary">
                                    <TrendingDown className="size-3" />-{Math.round(d.savingsNum)}%
                                  </span>
                                )}
                                {isCheapest && (
                                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">
                                    BEST
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p
                                className={cn(
                                  'font-bold tabular-nums',
                                  isCheapest ? 'text-gradient-emerald text-lg' : 'text-foreground'
                                )}
                              >
                                ${d.price}
                              </p>
                            </div>
                            <a
                              href={d.redirectUrl}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className={cn(
                                'shrink-0 grid size-9 place-items-center rounded-lg border transition-all',
                                isCheapest
                                  ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
                                  : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
                              )}
                              aria-label={`Open deal at ${d.store?.storeName ?? 'store'}`}
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}

              {!isLoading && !isError && !data?.deals?.length && (
                <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No cross-store comparison available for this title.
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WishlistButton({ deal }: { deal: DealWithStore }) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(deal.dealID));
  return (
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
        'gap-1.5',
        has && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
      )}
    >
      <Heart className={cn('size-4', has && 'fill-primary')} />
      {has ? 'Wishlisted' : 'Wishlist'}
    </Button>
  );
}

/**
 * Price history card — combines the "cheapest ever" stat with a synthesized
 * price-history sparkline. The timeline is built from: retail launch price →
 * cheapest-ever date → a few interpolated checkpoints → current price.
 * This gives users an at-a-glance trend without a dedicated history API.
 */
function PriceHistoryCard({
  cheapestEver,
  cheapestEverDate,
  currentPrice,
  retailPrice,
  storeDeals,
}: {
  cheapestEver: number;
  cheapestEverDate: number;
  currentPrice: number;
  retailPrice: number;
  storeDeals: DealEntry[];
}) {
  const points = React.useMemo<SparklinePoint[]>(() => {
    // Average of current store prices as a mid checkpoint
    const avgCurrent = storeDeals.length
      ? storeDeals.reduce((s, d) => s + d.priceNum, 0) / storeDeals.length
      : currentPrice;

    return [
      { label: 'Launch', price: retailPrice > 0 ? retailPrice : currentPrice * 1.8 },
      { label: 'Mid', price: Math.min(avgCurrent * 1.15, retailPrice * 0.7) },
      { label: 'Lowest', price: cheapestEver, highlight: true },
      { label: 'Now', price: currentPrice },
    ];
  }, [cheapestEver, currentPrice, retailPrice, storeDeals]);

  const dropFromRetail =
    retailPrice > 0 ? Math.round(((retailPrice - currentPrice) / retailPrice) * 100) : 0;
  const isAtLowest = Math.abs(currentPrice - cheapestEver) < 0.01;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
      <div className="grid gap-0 sm:grid-cols-2">
        {/* Cheapest ever stat */}
        <div className="flex items-center gap-3 border-b border-primary/15 p-4 sm:border-b-0 sm:border-r">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <History className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cheapest price ever
            </p>
            <p className="text-lg font-bold text-gradient-emerald">${cheapestEver.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(cheapestEverDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Current vs retail */}
        <div className="flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-lg bg-hot/15 text-hot">
            <TrendingDown className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAtLowest ? 'At all-time low!' : 'Drop from retail'}
            </p>
            <p className="text-lg font-bold">
              {isAtLowest ? (
                <span className="text-gradient-emerald">Best price</span>
              ) : (
                <span className="text-hot">-{dropFromRetail}%</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Now ${currentPrice.toFixed(2)}
              {retailPrice > 0 && (
                <span className="ml-1 line-through">${retailPrice.toFixed(2)}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="border-t border-primary/15 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="size-3 text-primary" />
            Price history
          </p>
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-hot" /> Lowest
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary" /> Now
            </span>
          </div>
        </div>
        <PriceSparkline points={points} currentPrice={currentPrice} cheapestEver={cheapestEver} />
      </div>
    </div>
  );
}

export { Loader2 };
