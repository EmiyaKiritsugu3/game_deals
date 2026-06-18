import styles from './GameStatsRow.module.css';

interface GameStatsRowProps {
  readonly bestCurrentPrice: number;
  readonly isFree: boolean;
  readonly bestRawPrice: string;
  readonly cheapestEver: number;
  readonly isCurrentlyAtHL: boolean;
  readonly costPerHour: string;
  readonly playtimeMain: number;
}

export default function GameStatsRow({
  bestCurrentPrice,
  isFree,
  bestRawPrice,
  cheapestEver,
  isCurrentlyAtHL,
  costPerHour,
  playtimeMain,
}: GameStatsRowProps) {
  return (
    <div className={styles.statsRow}>
      <div className={styles.statBlock}>
        <span className={styles.statLabel}>Best Price Now</span>
        <span className={styles.statValue}>
          {bestCurrentPrice === 0 || isFree ? (
            <span className={styles.freeTag}>FREE</span>
          ) : (
            `$${bestRawPrice}`
          )}
        </span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statBlock}>
        <span className={styles.statLabel}>Historical Low</span>
        <span className={`${styles.statValue} ${styles.hlValue}`}>
          ${cheapestEver.toFixed(2)}
          {isCurrentlyAtHL && <span className={styles.hlActiveBadge}>LIVE HL</span>}
        </span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statBlock}>
        <span className={styles.statLabel}>🎮 Value</span>
        <span className={styles.statValue}>{costPerHour}</span>
        <span className={styles.statSub}>~{playtimeMain}h campaign</span>
      </div>
    </div>
  );
}
