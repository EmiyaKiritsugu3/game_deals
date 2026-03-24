'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage } from '@/services/api';

function SharedWishlistContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get('ids');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const validGames = results.reduce((acc: any[], gameData, idx) => {
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                <p className="text-muted-foreground">Carregando a Wishlist compartilhada...</p>
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Wishlist não encontrada</h2>
                <p className="text-muted-foreground">O link pode estar expirado ou inválido.</p>
                <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium">Ir para a Home</Link>
            </div>
        );
    }

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl mb-8 flex flex-col items-center justify-center py-16 px-4 text-center">
                {games[0]?.thumb && (
                    <div 
                        className="absolute inset-0 z-0 bg-cover bg-center blur-2xl opacity-20 scale-110"
                        style={{ backgroundImage: `url(${games[0].thumb})` }}
                    />
                )}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />
                <div className="relative z-20 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">🎁 Wishlist Compartilhada</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {games.length} {games.length === 1 ? 'jogo' : 'jogos'} nesta lista · Presenteie usando os links abaixo!
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {games.map((game, idx) => (
                    <div key={`${game.gameID}-${idx}`} className="group relative flex flex-col bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300">
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <Image
                                src={game.thumb}
                                alt={game.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {game.savings > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-black text-xs font-black rounded-md shadow-lg shadow-green-500/20 z-10">
                                    -{game.savings}%
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="text-base font-bold text-foreground line-clamp-2 mb-2" title={game.title}>{game.title}</h3>
                            <div className="mt-auto flex items-end justify-between">
                                <div className="flex flex-col">
                                    {game.savings > 0 && (
                                        <span className="text-xs text-muted-foreground line-through">${game.normalPrice}</span>
                                    )}
                                    <span className="text-lg font-black text-foreground">${game.salePrice}</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-sm">{stores[game.storeID] || 'Store'}</span>
                            </div>
                            <Link href={`/game/${game.gameID}`} className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold text-center text-foreground transition-colors flex items-center justify-center gap-2">
                                🎁 Comprar como Presente
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default function SharedWishlistPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background pb-24">
            <div className="container mx-auto px-4 max-w-7xl mt-8">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Carregando...</div>}>
                    <SharedWishlistContent />
                </Suspense>
            </div>
        </main>
    );
}
