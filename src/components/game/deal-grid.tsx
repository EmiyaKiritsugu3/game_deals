'use client';

import { Gamepad2, Inbox } from 'lucide-react';
import type { DealWithStore } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
// DealCard and DealCardSkeleton removed (deal-card not yet ported)
// density-toggle import removed;

export interface DealGridItem {
  deal: DealWithStore;
  /** Number of stores carrying this same game (for the "N stores" badge). */
  variantCount?: number;
}

interface DealGridProps {
  /** Accepts either a flat array of deals (variantCount=1) or pre-built grid items. */
  deals: DealWithStore[] | DealGridItem[];
  loading: boolean;
  error: boolean;
  onOpenDetail?: (deal: DealWithStore) => void;
  onShare?: (deal: DealWithStore) => void;
}

function isGridItemsArray(arr: DealWithStore[] | DealGridItem[]): arr is DealGridItem[] {
  return arr.length > 0 && 'variantCount' in (arr[0] as unknown as Record<string, unknown>);
}

export function DealGrid({
  deals,
  loading,
  error,
  // density = 'comfortable',
}: DealGridProps) {
  const gridCls = cn(
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children'
    // density === 'comfortable' ? 'gap-4' : 'gap-3 xl:grid-cols-5'
  );

  if (loading) {
    return (
      <div className={gridCls}>
        {Array.from({ length: 8 }).map((_unused) => (
          <div key={item.deal.dealID} className="skeleton-shimmer h-80 rounded-2xl glass" />
        ))}
      </div>
    );
  }

  if (error && !deals.length) {
    return (
      <div
        role="alert"
        className="grid place-items-center rounded-2xl glass border-dashed py-20 text-center animate-fade-in"
      >
        <Inbox className="size-10 text-muted-foreground/50" />
        <p className="mt-3 font-semibold">Couldn&apos;t reach the deals feed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing a cached snapshot. Try refreshing in a moment.
        </p>
      </div>
    );
  }

  if (!deals.length) {
    return (
      <div
        role="status"
        className="grid place-items-center rounded-2xl glass border-dashed py-20 text-center animate-fade-in"
      >
        <Gamepad2 className="size-10 text-muted-foreground/50" />
        <p className="mt-3 font-semibold">No deals match your filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try clearing the search or switching stores.
        </p>
      </div>
    );
  }

  // Normalize input: accept either DealWithStore[] or DealGridItem[]
  const items = isGridItemsArray(deals)
    ? (deals as DealGridItem[])
    : (deals as DealWithStore[]).map((d) => ({ deal: d, variantCount: 1 }) as DealGridItem);

  return (
    <div className={gridCls} aria-live="polite" aria-busy={loading}>
      {items.map((item) => (
        <div key={item.deal.dealID} className="flex flex-col rounded-2xl glass lift-on-hover p-4">
          <p className="font-semibold text-sm truncate">{item.deal.title}</p>
          <p className="text-xs text-muted-foreground mt-1">${item.deal.salePrice}</p>
        </div>
      ))}
    </div>
  );
}
