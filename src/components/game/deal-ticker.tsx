'use client';

import { Flame, TrendingDown } from 'lucide-react';
import { dedupeToList } from '@/lib/dedup';
import type { DealWithStore } from '@/lib/types';

interface DealTickerProps {
  deals: DealWithStore[];
}

export function DealTicker({ deals }: DealTickerProps) {
  // Dedupe by title so the ticker doesn't show the same game from multiple stores.
  // Pick the cheapest variant per game, then take the top 14 by savings.
  const top = dedupeToList(deals, 14)
    .sort((a, b) => b.savingsNum - a.savingsNum)
    .slice(0, 14);

  if (!top.length) return null;

  // Duplicate for seamless infinite scroll
  const loop = [...top, ...top];

  return (
    <div className="relative overflow-hidden rounded-2xl glass border-border/40 py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      <div className="flex items-center gap-2">
        <div className="z-20 flex shrink-0 items-center gap-1.5 rounded-md bg-hot/15 px-2.5 py-1 text-xs font-bold text-hot ml-3">
          <Flame className="size-3.5 animate-heartbeat" />
          LIVE
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker items-center gap-6 pr-6">
            {loop.map((d, i) => (
              <span
                key={`${d.dealID}-${i}`} /* biome-ignore lint/suspicious/noArrayIndexKey: static display */
                className="inline-flex shrink-0 items-center gap-2 text-sm"
              >
                <TrendingDown className="size-3.5 text-primary" />
                <span className="font-medium text-foreground/90">{d.title}</span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
                  -{Math.round(d.savingsNum)}%
                </span>
                <span className="font-mono text-xs text-muted-foreground">${d.salePrice}</span>
                <span className="text-muted-foreground/40">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
