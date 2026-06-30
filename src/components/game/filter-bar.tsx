'use client';

import { Check, SlidersHorizontal, Store as StoreIcon, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { SortOption, Store } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  stores: Store[];
  storeID: string;
  onStoreChange: (id: string) => void;
  onSale: boolean;
  onSaleChange: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  resultCount: number;
  source: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'deal-rating', label: 'Deal Rating' },
  { value: 'savings', label: 'Biggest Savings' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'metacritic', label: 'Metacritic Score' },
  { value: 'recent', label: 'Recently Released' },
];

export function FilterBar(props: FilterBarProps) {
  const [storeSheetOpen, setStoreSheetOpen] = React.useState(false);
  const activeStore = props.stores.find((s) => s.storeID === props.storeID);

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="glass-strong rounded-2xl border border-border/60 p-2.5 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search (mobile-collapsible) */}
          <div className="relative order-1 min-w-0 flex-1 sm:order-none sm:flex-none">
            <input
              type="text"
              value={props.search}
              onChange={(e) => props.onSearchChange(e.target.value)}
              placeholder="Filter by title…"
              className="h-9 w-full rounded-lg border border-border/50 bg-card/40 px-3 text-sm backdrop-blur-md placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-48"
            />
            {props.search && (
              <button
                onClick={() => props.onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Store selector (sheet on small, inline select on large) */}
          <Sheet open={storeSheetOpen} onOpenChange={setStoreSheetOpen}>
            <SheetTrigger>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-border/50 bg-card/40 px-3 backdrop-blur-md hover:border-primary/40 lg:hidden"
              >
                <StoreIcon className="size-4" />
                {activeStore ? activeStore.storeName : 'Stores'}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="glass-strong max-h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <StoreIcon className="size-4 text-primary" /> Choose a store
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                <StoreButton
                  active={props.storeID === ''}
                  onClick={() => {
                    props.onStoreChange('');
                    setStoreSheetOpen(false);
                  }}
                  name="All stores"
                />
                {props.stores.map((s) => (
                  <StoreButton
                    key={s.storeID}
                    active={props.storeID === s.storeID}
                    onClick={() => {
                      props.onStoreChange(s.storeID);
                      setStoreSheetOpen(false);
                    }}
                    name={s.storeName}
                    logoUrl={s.logoUrl}
                  />
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop store select — Radix SelectItem cannot use empty string, so use "all" sentinel */}
          <Select
            value={props.storeID || 'all'}
            onValueChange={(v) => props.onStoreChange(v === 'all' ? '' : (v ?? ''))}
          >
            <SelectTrigger className="hidden h-9 w-[150px] rounded-lg border-border/50 bg-card/40 backdrop-blur-md lg:flex">
              <div className="flex items-center gap-2">
                <StoreIcon className="size-4 text-muted-foreground" />
                <SelectValue placeholder="All stores" />
              </div>
            </SelectTrigger>
            <SelectContent className="glass-strong max-h-80">
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span className="grid size-4 place-items-center rounded bg-primary/20 text-[9px] font-bold text-primary">
                    ALL
                  </span>
                  All stores
                </span>
              </SelectItem>
              {props.stores.map((s) => (
                <SelectItem key={s.storeID} value={s.storeID}>
                  <span className="flex items-center gap-2">
                    {}
                    <img src={s.logoUrl} alt="" className="size-4 rounded-[3px] object-contain" />
                    {s.storeName}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={props.sortBy} onValueChange={(v) => props.onSortChange(v as SortOption)}>
            <SelectTrigger className="h-9 w-[170px] rounded-lg border-border/50 bg-card/40 backdrop-blur-md">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* On sale toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-1.5 backdrop-blur-md">
            <Switch
              id="onsale"
              checked={props.onSale}
              onCheckedChange={props.onSaleChange}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="onsale" className="cursor-pointer text-xs font-medium">
              On sale
            </Label>
          </div>

          {/* Result count */}
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Badge
              variant="secondary"
              className="h-7 gap-1.5 rounded-lg bg-card/60 px-2.5 text-xs font-medium"
            >
              <span className="size-1.5 rounded-full bg-primary animate-blink-soft" />
              {props.resultCount} deals
            </Badge>
            {props.source === 'fallback' && (
              <Badge variant="outline" className="h-7 border-amber-500/30 text-amber-400">
                cached
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreButton({
  active,
  onClick,
  name,
  logoUrl,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  logoUrl?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border/50 bg-card/30 text-foreground hover:border-primary/30 hover:bg-accent/30'
      )}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-5 rounded object-contain" />
      ) : (
        <span className="grid size-5 place-items-center rounded bg-primary/20 text-[9px] font-bold text-primary">
          ALL
        </span>
      )}
      <span className="truncate">{name}</span>
      {active && <Check className="ml-auto size-4 text-primary" />}
    </button>
  );
}
