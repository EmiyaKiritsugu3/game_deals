interface DealsBadgeProps {
  readonly type: 'HL' | 'EPIC' | 'FREE' | 'RATING' | 'FRESH';
  readonly value?: string | number;
  readonly className?: string;
  readonly compact?: boolean;
}

const baseClass =
  'inline-flex items-center justify-center px-[0.4rem] py-[0.15rem] rounded text-[0.65rem] font-extrabold tracking-wider uppercase whitespace-nowrap';

const typeClasses: Record<string, string> = {
  HL: 'bg-[var(--accent-hl)] text-[var(--accent-hl-foreground)]',
  EPIC: 'bg-gradient-to-r from-[#ff4b2b] to-[#ff416c] text-foreground shadow-[0_0_10px_rgba(255,75,43,0.3)]',
  FREE: 'bg-primary text-primary-foreground',
  RATING: 'bg-foreground/5 text-foreground border border-border',
  FRESH:
    'bg-gradient-to-r from-[hsl(142,88%,27%)] to-[hsl(142,100%,42%)] text-[hsl(142,100%,10%)] shadow-[0_0_8px_hsl(142,88%,27%/0.3)]',
};

/**
 * Unified Badge component for consistent deal tagging across the site.
 * Harmonizes thresholds:
 * - HL: Current price <= Historical Low * 1.05 (5% margin)
 * - EPIC: Savings >= 75%
 */
export default function DealsBadge({
  type,
  value,
  className = '',
  compact = false,
}: DealsBadgeProps) {
  if (type === 'HL') {
    return (
      <span
        className={`${baseClass} ${typeClasses[type]} ${className}`}
        title="Historical Low Price (Within 5% of all-time low)"
      >
        HL
      </span>
    );
  }

  if (type === 'EPIC') {
    return (
      <span className={`${baseClass} ${typeClasses[type]} ${className}`} title="Epic Deal">
        {compact ? '\u{1F525}' : '\u{1F525} EPIC'}
      </span>
    );
  }

  if (type === 'FREE') {
    return (
      <span className={`${baseClass} ${typeClasses[type]} ${className}`} title="Free Game">
        FREE
      </span>
    );
  }

  if (type === 'FRESH') {
    return (
      <span className={`${baseClass} ${typeClasses[type]} ${className}`} title="Recently Added">
        NEW
      </span>
    );
  }

  if (type === 'RATING' && value) {
    return (
      <span className={`${baseClass} ${typeClasses[type]} ${className}`} title="Rating">
        {'★'} {value}%
      </span>
    );
  }

  return null;
}
