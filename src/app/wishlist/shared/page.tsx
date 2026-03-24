'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage } from '@/services/api';
import styles from '../page.module.css';

function SharedWishlistContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get('ids');
    const [games, setGames] = useState<any[]>([]);
    const [stores, setStores] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchGames() {
            if (!idsParam) {
                setIsLoading(false);
                return;
            }

            try {
                const decoded = atob(idsParam);
                const gameIDs = decoded.split(',').filter(Boolean);

                const storesMap = await getStores();
                setStores(storesMap);

                const results = await Promise.all(
                    gameIDs.map(id => getGame(id).catch(() => null))
                );

                const validGames = results.reduce((acc: unknown[], gameData, idx) => {
                    if (!gameData || !gameData.info) return acc;
                    const currentBest = [...gameData.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
                    acc.push({
                        gameID: gameIDs[idx],
                        title: gameData.info.title,
                        thumb: getHighResImage(gameData.info.thumb),
                        salePrice: currentBest?.price || gameData.cheapestPriceEver.price,
                        normalPrice: currentBest?.retailPrice || gameData.cheapestPriceEver.price,
                        savings: currentBest ? Math.round(parseFloat(currentBest.savings)) : 0,
                        storeID: currentBest?.storeID || '1',
                    });
                    return acc;
                }, []);

                setGames(validGames);
            } catch (err) {
                console.error('Failed to decode shared wishlist:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchGames();
    }, [idsParam]);

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
                <Link href="/" className={styles.browseButton}>Ir para a Home</Link>
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
                        {games.length} {games.length === 1 ? 'jogo' : 'jogos'} nesta lista · Presenteie usando os links abaixo!
                    </p>
                </div>
            </div>

            <div className={styles.grid}>
                {games.map((game, idx) => (
                    <div key={`${game.gameID}-${idx}`} className={styles.wishlistCard}>
                        <div className={styles.imageContainer}>
                            <Image
                                src={game.thumb}
                                alt={game.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className={styles.image}
                            />
                            {game.savings > 0 && (
                                <div className={styles.savingsBadge}>
                                    -{game.savings}%
                                </div>
                            )}
                        </div>
                        <div className={styles.content}>
                            <h3 className={styles.cardTitle} title={game.title}>{game.title}</h3>
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
                <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Carregando...</div>}>
                    <SharedWishlistContent />
                </Suspense>
            </div>
        </main>
    );
}
