import Image from 'next/image';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import styles from './GameHero.module.css';

interface GameHeroProps {
  gameId: string;
  gameTitle: string;
  thumb: string;
  bestCurrentPrice: number;
  priority?: boolean;
  size?: 'full' | 'compact';
}

export default function GameHero({
  gameId,
  gameTitle,
  thumb,
  bestCurrentPrice,
  priority = false,
  size = 'full',
}: GameHeroProps) {
  const sizeClass = size === 'compact' ? styles.compact : styles.full;

  return (
    <div className={`${styles.heroContainer} ${sizeClass}`}>
      <Image src={thumb} alt={gameTitle} fill className={styles.heroImage} priority={priority} />
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1 className={styles.title}>{gameTitle}</h1>
        <div className={styles.actionButtons}>
          <PriceAlertTrigger
            gameID={gameId}
            gameTitle={gameTitle}
            currentPrice={bestCurrentPrice}
          />
          <HeartButton gameID={gameId} />
        </div>
      </div>
    </div>
  );
}
