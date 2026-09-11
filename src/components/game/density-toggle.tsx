'use client';

import { LayoutGrid, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GridDensity = 'comfortable' | 'compact';

interface DensityToggleProps {
  value: GridDensity;
  onChange: (v: GridDensity) => void;
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/40 p-0.5 backdrop-blur-md"
      role="group"
      aria-label="Grid density"
    >
      <button
        type="button"
        onClick={() => onChange('comfortable')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          value === 'comfortable'
            ? 'bg-primary/15 text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={value === 'comfortable'}
      >
        <LayoutGrid className="size-3.5" />
        <span className="hidden sm:inline">Comfortable</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('compact')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          value === 'compact'
            ? 'bg-primary/15 text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={value === 'compact'}
      >
        <Rows3 className="size-3.5" />
        <span className="hidden sm:inline">Compact</span>
      </button>
    </div>
  );
}
