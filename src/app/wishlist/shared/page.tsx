'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage } from '@/services/api';

interface SharedGame {
    gameID: string;
    title: string;
    thumb: string;
    salePrice: string;
    normalPrice: string;
    savings: number;
    storeID: string;
}

function SharedWishlistContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get('ids');
    const [games, setGames] = useState<SharedGame[]>([]);
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

                const validGames = results.reduce((acc: SharedGame[], gameData, idx) => {
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
            <div className="flex flex-col items-center justify-center gap-6 py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-primary"></div>
                <p className="text-sm font-medium text-muted-foreground">Carregando a Wishlist compartilhada...</p>
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <h2 className="text-2xl font-black text-white md:text-3xl">Wishlist não encontrada</h2>
                <p className="text-sm text-muted-foreground">O link pode estar expirado ou inválido.</p>
                <Link href="/" className="mt-4 rounded-lg bg-primary px-8 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-1 hover:shadow-primary/50">Ir para a Home</Link>
            </div>
        );
    }

    return (
        <>
            <div className="relative mb-8 flex min-h-[220px] flex-col justify-center overflow-hidden rounded-4xl border border-white/5 bg-surface p-8 shadow-2xl md:p-12">
                {games[0]?.thumb && (
                    <div 
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity filter blur-xs"
                        style={{ backgroundImage: `url(${games[0].thumb})` }}
                    />
                )}
                <div className="absolute inset-0 z-0 bg-linear-to-r from-background/90 to-background/40" />
                <div className="relative z-10">
                    <h1 className="mb-2 text-4xl font-black tracking-tight text-white drop-shadow-md md:text-5xl">🎁 Wishlist Compartilhada</h1>
                    <p className="text-lg font-medium text-muted-foreground">
                        {games.length} {games.length === 1 ? 'jogo' : 'jogos'} nesta lista · Presenteie usando os links abaixo!
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 lg:gap-8">
                {games.map((game, idx) => (
                    <div key={`${game.gameID}-${idx}`} className="group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-card transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">
                        <div className="relative aspect-460/215 w-full overflow-hidden bg-black/50">
                            <Image
                                src={game.thumb}
                                alt={game.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {game.savings > 0 && (
                                <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-sm font-black text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-110">
                                    -{game.savings}%
                                </div>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                            <h3 className="mb-2 line-clamp-2 text-base font-bold text-white transition-colors group-hover:text-primary" title={game.title}>{game.title}</h3>
                            <div className="mb-3 flex items-baseline gap-2">
                                {game.savings > 0 && (
                                    <span className="text-sm font-semibold text-muted-foreground line-through">${game.normalPrice}</span>
                                )}
                                <span className="text-xl font-black text-white">${game.salePrice}</span>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="rounded bg-white/5 px-2 py-1 text-xs font-semibold text-muted-foreground">{stores[game.storeID] || 'Store'}</span>
                                <Link href={`/game/${game.gameID}`} className="rounded bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                                    🎁 Presentear
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
        <main className="min-h-screen bg-background pb-12">
            <div className="container mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pt-12">
                <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
                    <SharedWishlistContent />
                </Suspense>
            </div>
        </main>
    );
}
