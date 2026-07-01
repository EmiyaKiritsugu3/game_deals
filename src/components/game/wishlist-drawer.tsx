'use client';

import {
  Crown,
  ExternalLink,
  Heart,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { MiniSparkline, synthesizePriceTimeline } from '@/components/game/mini-sparkline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { dealRedirectUrl } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

export function WishlistDrawer() {
  const { items, isOpen, setOpen, clear, remove } = useWishlist();
  const totalSavings = items.reduce(
    (sum, i) => sum + (Number(i.normalPrice) - Number(i.salePrice)),
    0
  );
  const totalCurrent = items.reduce((sum, i) => sum + Number(i.salePrice), 0);
  const totalRetail = items.reduce((sum, i) => sum + Number(i.normalPrice), 0);
  const avgSavings = totalRetail > 0 ? Math.round((totalSavings / totalRetail) * 100) : 0;

  // Track which item is "expanded" (showing the sparkline + price stats).
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (isOpen) {
      setExpandedId((prev) => (prev && items.some((i) => i.dealID === prev) ? prev : items[0]?.dealID ?? null));
    } else {
      setExpandedId(null);
    }
  }, [isOpen]);
  // Keep expandedId in sync when items change while drawer is open
  React.useEffect(() => {
    if (isOpen && expandedId && !items.some((i) => i.dealID === expandedId)) {
      setExpandedId(items[0]?.dealID ?? null);
    }
  }, [items, isOpen, expandedId]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="glass-strong w-full border-border/60 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/40 p-5 text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Heart className="size-4 fill-primary animate-heartbeat" />
            </span>
            Your wishlist
            <Badge variant="secondary" className="ml-1 bg-primary/15 text-primary">
              {items.length}
            </Badge>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Your saved game deals. Remove items or open them to purchase.
          </SheetDescription>
        </SheetHeader>

        {/* Summary — expanded with avg savings + retail total */}
        {items.length > 0 && (
          <div className="border-b border-border/40 bg-card/30 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/40 bg-card/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current total
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">${totalCurrent.toFixed(2)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  was ${totalRetail.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Crown className="size-3" /> You save
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gradient-emerald">
                  ${totalSavings.toFixed(2)}
                </p>
                <p className="mt-0.5 text-[10px] text-primary/70">avg {avgSavings}% off</p>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {items.length === 0 ? (
            <div className="grid h-full place-items-center px-6 py-16 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-dashed border-border/60 text-muted-foreground/50">
                  <ShoppingBag className="size-7" />
                </span>
                <p className="mt-4 font-semibold">Your wishlist is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap the heart on any deal to save it here for later.
                </p>
                <Button
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  size="sm"
                >
                  <Sparkles className="size-3.5" />
                  Browse deals
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const salePrice = Number(item.salePrice) || 0;
                const normalPrice = Number(item.normalPrice) || 0;
                const savings = Number(item.savings) || 0;
                const lowest = item.lowestPrice ?? salePrice;
                const isAtLowest = salePrice > 0 && salePrice <= lowest;
                const dropFromBaseline =
                  item.baselinePrice > 0
                    ? Math.max(0, ((item.baselinePrice - salePrice) / item.baselinePrice) * 100)
                    : 0;
                const timeline = synthesizePriceTimeline(normalPrice, salePrice, lowest);
                const isExpanded = expandedId === item.dealID;

                return (
                  <li
                    key={item.dealID}
                    className={cn(
                      'group overflow-hidden rounded-xl border bg-card/30 transition-all animate-fade-in-up',
                      isExpanded
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40 hover:border-primary/30 hover:bg-accent/20'
                    )}
                  >
                    <div className="flex items-center gap-3 p-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.dealID)}
                        className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-card/60"
                        aria-label={isExpanded ? 'Collapse price details' : 'Expand price details'}
                        aria-expanded={isExpanded}
                      >
                        <Image
                          src={item.thumb}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                      <button
                        type="button"
                        className="min-w-0 flex-1 cursor-pointer text-left"
                        onClick={() => setExpandedId(isExpanded ? null : item.dealID)}
                      >
                        <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <span className="font-bold text-foreground tabular-nums">
                            {salePrice === 0 ? 'FREE' : `$${item.salePrice}`}
                          </span>
                          {normalPrice > salePrice && (
                            <>
                              <span className="text-muted-foreground line-through tabular-nums">
                                ${item.normalPrice}
                              </span>
                              <span className="rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary">
                                -{Math.round(savings)}%
                              </span>
                            </>
                          )}
                        </div>
                        {item.storeName && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {item.storeName}
                          </p>
                        )}
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={dealRedirectUrl(item.dealID)}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                          aria-label={`Open ${item.title}`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => remove(item.dealID)}
                          className="grid size-8 place-items-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-all hover:border-destructive/40 hover:text-destructive"
                          aria-label={`Remove ${item.title} from wishlist`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded price-detail panel with mini sparkline */}
                    {isExpanded && (
                      <div className="border-t border-border/40 bg-background/40 px-3 py-3 animate-fade-in">
                        <div className="flex items-center justify-between gap-2">
                          <MiniSparkline
                            prices={timeline}
                            lowest={lowest}
                            current={salePrice}
                            width={120}
                            height={36}
                            className="flex-1"
                            idSuffix={item.dealID.slice(0, 6)}
                          />
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <PriceStat
                              label="Lowest"
                              value={lowest === 0 ? 'FREE' : `$${lowest.toFixed(2)}`}
                              accent="amber"
                            />
                            <PriceStat
                              label="Now"
                              value={salePrice === 0 ? 'FREE' : `$${salePrice.toFixed(2)}`}
                              accent="primary"
                            />
                            <PriceStat
                              label="You save"
                              value={
                                normalPrice - salePrice > 0
                                  ? `$${(normalPrice - salePrice).toFixed(2)}`
                                  : '—'
                              }
                              accent="emerald"
                            />
                          </div>
                        </div>

                        {/* Status line */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {isAtLowest && salePrice > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Crown className="size-2.5" />
                              At all-time low
                            </span>
                          )}
                          {dropFromBaseline >= 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              <TrendingDown className="size-2.5" />
                              Dropped {Math.round(dropFromBaseline)}% since added
                            </span>
                          )}
                          {!isAtLowest && dropFromBaseline < 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                              Watching for drops…
                            </span>
                          )}
                          {item.lastChecked && (
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              Checked {formatRelative(item.lastChecked)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="border-t border-border/40 p-4">
            <div className="flex gap-2">
              <Button
                onClick={clear}
                variant="outline"
                className="flex-1 gap-1.5 border-border/50 bg-card/40 hover:border-destructive/40 hover:text-destructive"
              >
                <X className="size-4" />
                Clear all
              </Button>
              <Button
                className="flex-[2] gap-1.5 bg-primary text-primary-foreground shadow-md shadow-primary/30 sheen"
                onClick={() => setOpen(false)}
              >
                <ShoppingBag className="size-4" />
                Keep browsing
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PriceStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'primary' | 'amber' | 'emerald';
}) {
  const colorCls = {
    primary: 'text-primary',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  }[accent];
  return (
    <div className="rounded-md border border-border/40 bg-card/40 px-1.5 py-1">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('font-mono text-[11px] font-bold tabular-nums', colorCls)}>{value}</p>
    </div>
  );
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

