import { cn } from '@/lib/utils';

interface DealsBadgeProps {
  type: 'HL' | 'EPIC' | 'FREE' | 'RATING';
  value?: string | number;
  className?: string;
  compact?: boolean;
}

/**
 * Unified Badge component for consistent deal tagging across the site.
 * Harmonizes thresholds:
 * - HL: Current price <= Historical Low * 1.05 (5% margin)
 * - EPIC: Savings >= 75%
 */
export default function DealsBadge({ type, value, className = '', compact = false }: DealsBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 rounded text-xs font-extrabold uppercase tracking-wider shadow-sm";

  if (type === 'HL') {
    return (
      <span 
        className={cn(baseClasses, "bg-accent text-accent-foreground px-1.5 py-0.5", className)}
        title="Historical Low Price (Within 5% of all-time low)"
      >
        HL
      </span>
    );
  }

  if (type === 'EPIC') {
    return (
      <span className={cn(
          baseClasses,
          "bg-gradient-to-br from-red-500 to-pink-500 px-2 py-0.5 text-white shadow-[0_0_8px_rgba(255,65,108,0.4)]",
          className
      )}>
        {compact ? '🔥' : '🔥 EPIC'}
      </span>
    );
  }

  if (type === 'FREE') {
    return (
      <span className={cn(baseClasses, "bg-primary text-primary-foreground px-2 py-0.5", className)}>
        FREE
      </span>
    );
  }

  if (type === 'RATING' && value) {
    return (
      <span className={cn(baseClasses, "bg-blue-600 text-white px-1.5 py-0.5 shadow-none", className)}>
        ★ {value}%
      </span>
    );
  }

  return null;
}
