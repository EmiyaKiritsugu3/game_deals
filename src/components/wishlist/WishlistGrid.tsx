'use client';

import { HeartCrack } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import type { SavedGame } from '@/hooks/useSortedGames';
import styles from './WishlistGrid.module.css';

interface WishlistGridProps {
  readonly games: SavedGame[];
  readonly stores: Record<string, string>;
  readonly isLoading?: boolean;
}

function LoadingState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.spinner} />
      <p>Loading your games...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <HeartCrack size={64} className={styles.emptyIcon} />
      <h2>Your wishlist is empty :(</h2>
      <p>
        Go back to the main page and click the heart on games you want to track and follow prices!
      </p>
      <Link href="/" className={styles.browseButton}>
        Discover Epic Deals
      </Link>
    </div>
  );
}

export default function WishlistGrid({ games, stores, isLoading = false }: WishlistGridProps) {
  if (isLoading) return <LoadingState />;
  if (games.length === 0) return <EmptyState />;

  return (
    <div className={styles.grid}>
      {games.map((game) => (
        <div key={game.gameID} className={styles.wishlistCard}>
          <div className={styles.imageContainer}>
            <Image
              src={game.thumb}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={styles.image}
              unoptimized
            />
            <div className={styles.cardActions}>
              <PriceAlertTrigger
                gameID={game.gameID}
                gameTitle={game.title}
                currentPrice={Number.parseFloat(game.salePrice)}
                className={styles.alertShortcut}
              />
              <HeartButton gameID={game.gameID} className={styles.heartWrapper} />
            </div>
            {game.savings > 0 && <div className={styles.savingsBadge}>-{game.savings}%</div>}
          </div>
          <div className={styles.content}>
            <h3 className={styles.cardTitle} title={game.title}>
              {game.title}
            </h3>
            <div className={styles.priceContainer}>
              {game.savings > 0 && <span className={styles.normalPrice}>${game.normalPrice}</span>}
              <span className={styles.salePrice}>${game.salePrice}</span>
            </div>
            <div className={styles.meta}>
              <span className={styles.storeBadge}>
                {stores[game.storeID] || `Store ${game.storeID}`}
              </span>
              <Link href={`/game/${game.gameID}`} className={styles.viewDetailsBtn}>
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
