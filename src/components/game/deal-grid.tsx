'use client';

import { Gamepad2, Grid2x2, Inbox, Rows3 } from 'lucide-react';
import { DealCard, DealCardSkeleton } from '@/components/game/deal-card';
import type { DealWithStore } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';
import type { Density } from '@/store/density';
import { useDensity } from '@/store/density';

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
  /** Density override — uses store default if omitted. */
  density?: Density;
  onDensityChange?: (d: Density) => void;
}

function isGridItemsArray(arr: DealWithStore[] | DealGridItem[]): arr is DealGridItem[] {
  return arr.length > 0 && 'variantCount' in (arr[0] as unknown as Record<string, unknown>);
}

export function DealGrid({
  deals,
  loading,
  error,
  onOpenDetail,
  onShare,
  density: densityProp,
  onDensityChange,
}: DealGridProps) {
  const storeDensity = useDensity((s) => s.density);
  const storeToggle = useDensity((s) => s.toggle);
  const density = densityProp ?? storeDensity;
  const gridCls = cn(
    'grid stagger-children',
    density === 'comfortable'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
  );

  if (loading) {
    return (
      <div className={gridCls}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <DealCardSkeleton key={idx} />
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
    <section aria-live="polite" aria-busy={loading}>
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            const next: Density = density === 'comfortable' ? 'compact' : 'comfortable';
            onDensityChange?.(next);
            if (!onDensityChange) storeToggle();
          }}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} layout`}
        >
          {density === 'comfortable' ? <Grid2x2 size={16} /> : <Rows3 size={16} />}
        </button>
      </div>
      <div className={gridCls}>
        {items.map((item) => (
          <DealCard
            key={item.deal.dealID}
            deal={item.deal}
            variantCount={item.variantCount}
            onOpenDetail={onOpenDetail}
            onShare={onShare}
          />
        ))}
      </div>
    </section>
  );
}
