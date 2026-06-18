'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import { buildSharedGamesList, decodeSharedWishlistIds, type GameEntry } from '@/lib/wishlist-data';
import styles from '../page.module.css';

function EmptySharedState() {
  return (
    <div className={styles.emptyState}>
      <h2>Wishlist not found</h2>
      <p>The link may be expired or invalid.</p>
      <Link href="/" className={styles.browseButton}>
        Go to Home
      </Link>
    </div>
  );
}

function SharedGameCard({ game, stores }: { game: GameEntry; stores: Record<string, string> }) {
  return (
    <div className={styles.wishlistCard}>
      <div className={styles.imageContainer}>
        <Image
          src={game.thumb}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={styles.image}
        />
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
          <span className={styles.storeBadge}>{stores[game.storeID] || 'Store'}</span>
          <Link href={`/game/${game.gameID}`} className={styles.viewDetailsBtn}>
            🎁 Buy as Gift
          </Link>
        </div>
      </div>
    </div>
  );
}

function SharedWishlistContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
  const gameIds = useMemo(() => decodeSharedWishlistIds(idsParam), [idsParam]);
  const { data, isLoading } = useWishlistGames(gameIds);
  const [stores, setStores] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data?.stores) setStores(data.stores);
  }, [data?.stores]);
  const games = useMemo(() => buildSharedGamesList(data, gameIds), [data, gameIds]);

  if (isLoading)
    return (
      <div className={styles.emptyState}>
        <div className={styles.spinner}></div>
        <p>Loading shared wishlist...</p>
      </div>
    );

  if (games.length === 0) return <EmptySharedState />;

  return (
    <>
      <div className={styles.heroHeader}>
        {games[0]?.thumb && (
          <div
            className={styles.heroBackground}
            style={{ backgroundImage: `url(${games[0].thumb})` }}
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>🎁 Shared Wishlist</h1>
          <p className={styles.subtitle}>
            {games.length} {games.length === 1 ? 'game' : 'games'} in this list · Gift using
            the links below!
          </p>
        </div>
      </div>
      <div className={styles.grid}>
        {games.map((game) => (
          <SharedGameCard key={game.gameID} game={game} stores={stores} />
        ))}
      </div>
    </>
  );
}

export default function SharedWishlistPage() {
  return (
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        <Suspense
          fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>}
        >
          <SharedWishlistContent />
        </Suspense>
      </div>
    </main>
  );
}
