import styles from './BadgeIcon.module.css';

interface BadgeIconProps {
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  size?: number;
  name: string;
}

/**
 * Display a premium achievement badge with rarity-based styling.
 */
export default function BadgeIcon({ rarity, size = 48, name }: BadgeIconProps) {
  const rarityClass = styles[rarity.toLowerCase()];

  return (
    <div 
        className={`${styles.container} ${rarityClass}`}
        style={{ width: size, height: size }}
        title={`${name} (${rarity})`}
    >
      <div className={styles.inner}>
        {/* Placeholder SVG icon based on rarity or type */}
        <svg viewBox="0 0 24 24" fill="currentColor">
            {rarity === 'Legendary' ? (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            ) : (
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            )}
        </svg>
      </div>
      <div className={styles.label}>{name}</div>
    </div>
  );
}
