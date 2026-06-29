'use client';

import { Award, Calendar, Filter, Percent, Star, Trophy } from 'lucide-react';
import type { DealWithStore } from '@/lib/deal-utils';
import { cn } from '@/lib/utils';

export type SmartFilterKey =
  | 'all'
  | 'top-rated'
  | 'metacritic-80'
  | 'steam-80'
  | 'newest'
  | 'biggest-savings';

export interface SmartFilter {
  key: SmartFilterKey;
  label: string;
  icon: React.ElementType;
  /** Accent color class used when the chip is active. */
  accent: 'primary' | 'amber' | 'purple' | 'cyan' | 'rose';
  /** Human-readable predicate description (for tooltip/title). */
  description: string;
}

export const SMART_FILTERS: SmartFilter[] = [
  {
    key: 'all',
    label: 'All deals',
    icon: Filter,
    accent: 'primary',
    description: 'No filter applied',
  },
  {
    key: 'top-rated',
    label: 'Top rated',
    icon: Award,
    accent: 'amber',
    description: 'Deal rating ≥ 9 out of 10',
  },
  {
    key: 'metacritic-80',
    label: 'Metacritic ≥ 80',
    icon: Trophy,
    accent: 'amber',
    description: 'Critic score 80 or higher',
  },
  {
    key: 'steam-80',
    label: 'Steam ≥ 80%',
    icon: Star,
    accent: 'cyan',
    description: 'Steam positive review ratio 80% or higher',
  },
  {
    key: 'newest',
    label: 'Released 2023+',
    icon: Calendar,
    accent: 'purple',
    description: 'Games released in 2023 or later',
  },
  {
    key: 'biggest-savings',
    label: 'Savings ≥ 90%',
    icon: Percent,
    accent: 'rose',
    description: 'At least 90% off retail price',
  },
];

const ACCENT_ACTIVE: Record<SmartFilter['accent'], string> = {
  primary: 'chip-active border-primary/50 text-primary',
  amber:
    'bg-amber-500/15 border-amber-400/60 text-amber-300 shadow-[0_0_0_1px_oklch(0.78_0.16_70/0.4),0_6px_20px_-8px_oklch(0.78_0.16_70/0.6)]',
  purple:
    'bg-fuchsia-500/15 border-fuchsia-400/60 text-fuchsia-300 shadow-[0_0_0_1px_oklch(0.7_0.2_300/0.4),0_6px_20px_-8px_oklch(0.7_0.2_300/0.6)]',
  cyan: 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_0_1px_oklch(0.7_0.2_200/0.4),0_6px_20px_-8px_oklch(0.7_0.2_200/0.6)]',
  rose: 'bg-rose-500/15 border-rose-400/60 text-rose-300 shadow-[0_0_0_1px_oklch(0.72_0.22_10/0.4),0_6px_20px_-8px_oklch(0.72_0.22_10/0.6)]',
};

interface SmartFilterChipsProps {
  value: SmartFilterKey;
  onChange: (key: SmartFilterKey) => void;
}

export function SmartFilterChips({ value, onChange }: SmartFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline-flex">
        Quick filters
      </span>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
        {SMART_FILTERS.map((filter) => {
          const active = value === filter.key;
          const Icon = filter.icon;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChange(filter.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300',
                active
                  ? ACCENT_ACTIVE[filter.accent]
                  : 'border-border/50 bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
              aria-pressed={active}
              title={filter.description}
            >
              <Icon
                className={cn(
                  'size-3.5',
                  active && filter.key === 'top-rated' && 'animate-heartbeat'
                )}
              />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Apply a smart meta-filter to a list of deals. Pure, client-safe.
 * Returns a new filtered array (does not mutate input).
 */
export function applySmartFilter(deals: DealWithStore[], key: SmartFilterKey): DealWithStore[] {
  if (key === 'all') return deals;
  switch (key) {
    case 'top-rated':
      return deals.filter((d) => d.dealRatingNum >= 9);
    case 'metacritic-80':
      return deals.filter((d) => d.metacriticScoreNum >= 80);
    case 'steam-80':
      return deals.filter((d) => d.steamRatingNum >= 80);
    case 'newest':
      return deals.filter((d) => {
        if (!d.releaseDateMs) return false;
        return new Date(d.releaseDateMs).getFullYear() >= 2023;
      });
    case 'biggest-savings':
      return deals.filter((d) => d.savingsNum >= 90);
    default:
      return deals;
  }
}
