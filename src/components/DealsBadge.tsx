import styles from './DealsBadge.module.css';

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
export default function DealsBadge({
  type,
  value,
  className = '',
  compact = false,
}: DealsBadgeProps) {
  if (type === 'HL') {
    return (
      <span
        className={`${styles.badge} ${styles.hl} ${className}`}
        title="Historical Low Price (Within 5% of all-time low)"
      >
        HL
      </span>
    );
  }

  if (type === 'EPIC') {
    return (
      <span className={`${styles.badge} ${styles.epic} ${className}`}>
        {compact ? '🔥' : '🔥 EPIC'}
      </span>
    );
  }

  if (type === 'FREE') {
    return <span className={`${styles.badge} ${styles.free} ${className}`}>FREE</span>;
  }

  if (type === 'RATING' && value) {
    return <span className={`${styles.badge} ${styles.rating} ${className}`}>★ {value}%</span>;
  }

  return null;
}
