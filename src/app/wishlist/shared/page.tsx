'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import { getHighResImage } from '@/services/api';
import styles from '../page.module.css';

type GameEntry = {
  gameID: string;
  title: string;
  thumb: string;
  salePrice: string;
  normalPrice: string;
  savings: number;
  storeID: string;
};

interface GameDataInfo {
  title: string;
  thumb: string;
}

interface GameDataDeal {
  price: string;
  retailPrice: string;
  savings: string;
  storeID: string;
}

interface GameDataCheapest {
  price: string;
}

interface GameDataShape {
  info?: GameDataInfo;
  deals: GameDataDeal[];
  cheapestPriceEver: GameDataCheapest;
}

function processGameResult(
  acc: GameEntry[],
  gameData: GameDataShape | null,
  idx: number,
  gameIDs: string[]
): GameEntry[] {
  if (!gameData?.info) return acc;
  const currentBest = [...gameData.deals].sort(
    (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
  )[0];
  acc.push({
    gameID: gameIDs[idx],
    title: gameData.info.title,
    thumb: getHighResImage(gameData.info.thumb),
    salePrice: currentBest?.price || gameData.cheapestPriceEver.price,
    normalPrice: currentBest?.retailPrice || gameData.cheapestPriceEver.price,
    savings: currentBest ? Math.round(Number.parseFloat(currentBest.savings)) : 0,
    storeID: currentBest?.storeID || '1',
  });
  return acc;
}

function decodeSharedWishlistIds(idsParam: string | null): string[] {
  if (!idsParam) return [];
  try {
    const decoded = atob(idsParam);
    return decoded
      .split(',')
      .filter(Boolean)
      .filter((id) => /^[a-zA-Z0-9]+$/.test(id));
  } catch {
    console.error('Invalid wishlist data');
    return [];
  }
}

function buildSharedGamesList(
  data: { games: (GameDataShape | null)[]; stores: Record<string, string> } | undefined,
  gameIds: string[]
): GameEntry[] {
  if (!data?.games || !gameIds.length) return [];
  return data.games.reduce(
    (acc, gameData, idx) => processGameResult(acc, gameData, idx, gameIds),
    [] as GameEntry[]
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

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.spinner}></div>
        <p>Carregando a Wishlist compartilhada...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Wishlist não encontrada</h2>
        <p>O link pode estar expirado ou inválido.</p>
        <Link href="/" className={styles.browseButton}>
          Ir para a Home
        </Link>
      </div>
    );
  }

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
          <h1 className={styles.title}>🎁 Wishlist Compartilhada</h1>
          <p className={styles.subtitle}>
            {games.length} {games.length === 1 ? 'jogo' : 'jogos'} nesta lista · Presenteie usando
            os links abaixo!
          </p>
        </div>
      </div>

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
              />
              {game.savings > 0 && <div className={styles.savingsBadge}>-{game.savings}%</div>}
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle} title={game.title}>
                {game.title}
              </h3>
              <div className={styles.priceContainer}>
                {game.savings > 0 && (
                  <span className={styles.normalPrice}>${game.normalPrice}</span>
                )}
                <span className={styles.salePrice}>${game.salePrice}</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.storeBadge}>{stores[game.storeID] || 'Store'}</span>
                <Link href={`/game/${game.gameID}`} className={styles.viewDetailsBtn}>
                  🎁 Comprar como Presente
                </Link>
              </div>
            </div>
          </div>
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
          fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Carregando...</div>}
        >
          <SharedWishlistContent />
        </Suspense>
      </div>
    </main>
  );
}
