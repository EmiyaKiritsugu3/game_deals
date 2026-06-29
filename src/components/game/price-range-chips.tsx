'use client';

import { DollarSign, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PriceRangeKey = 'all' | 'free' | 'under-5' | 'under-10' | 'under-20';

export interface PriceRange {
  key: PriceRangeKey;
  label: string;
  icon: React.ElementType;
  free?: boolean;
  upperPrice?: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { key: 'all', label: 'All prices', icon: DollarSign },
  { key: 'free', label: 'Free', icon: Gift, free: true },
  { key: 'under-5', label: 'Under $5', icon: DollarSign, upperPrice: 5 },
  { key: 'under-10', label: 'Under $10', icon: DollarSign, upperPrice: 10 },
  { key: 'under-20', label: 'Under $20', icon: DollarSign, upperPrice: 20 },
];

interface PriceRangeChipsProps {
  value: PriceRangeKey;
  onChange: (key: PriceRangeKey) => void;
}

export function PriceRangeChips({ value, onChange }: PriceRangeChipsProps) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {PRICE_RANGES.map((range) => {
        const active = value === range.key;
        const Icon = range.icon;
        return (
          <button
            key={range.key}
            type="button"
            onClick={() => onChange(range.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300',
              active
                ? range.free
                  ? 'chip-active border-fuchsia-400/60 text-fuchsia-300'
                  : 'chip-active'
                : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
            aria-pressed={active}
          >
            <Icon className={cn('size-3.5', range.free && active && 'animate-heartbeat')} />
            {range.label}
          </button>
        );
      })}
    </div>
  );
}

/** Resolve a PriceRangeKey into the API query params. */
export function rangeToQuery(key: PriceRangeKey): {
  free?: boolean;
  upperPrice?: number;
  lowerPrice?: number;
} {
  const range = PRICE_RANGES.find((r) => r.key === key);
  if (!range || key === 'all') return {};
  if (range.free) return { free: true };
  return { upperPrice: range.upperPrice };
}
