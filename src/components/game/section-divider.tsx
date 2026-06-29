'use client';

import { cn } from '@/lib/utils';

interface SectionDividerProps {
  label?: string;
  className?: string;
}

/**
 * Elegant animated divider with a centered label and shimmering gradient line.
 */
export function SectionDivider({ label, className }: SectionDividerProps) {
  return (
    <div className={cn('relative flex items-center justify-center gap-4 py-2', className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      {label && (
        <span className="relative inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-primary animate-blink-soft" />
          {label}
        </span>
      )}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
    </div>
  );
}
