'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeartCrack, Bell, List } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { useAlerts } from '@/store/alertStore';
import { getGame, getStores, getHighResImage } from '@/services/api';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import { cn } from '@/lib/utils';

interface SavedGame {
    gameID: string;
    title: string;
    thumb: string;
    salePrice: string;
    normalPrice: string;
    savings: number;
    storeID: string;
}

export default function WishlistPage() {
    const { wishlist } = useWishlist();
    const { alerts } = useAlerts();
    const [activeTab, setActiveTab] = useState<'wishlist' | 'alerts'>('wishlist');
    const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
    const [stores, setStores] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchWishlistGames() {
            if (wishlist.length === 0) {
                setSavedGames([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch stores for mapping
                const storesMap = await getStores();
                setStores(storesMap);

                // Fetch all games in parallel over the /game endpoint
                const uniqueWishlist = Array.from(new Set(wishlist));
                const gamePromises = uniqueWishlist.map(id => getGame(id).catch(() => null));
                const results = await Promise.all(gamePromises);

                const validGames = results.reduce((acc: SavedGame[], gameData, idx) => {
                    if (!gameData || !gameData.info) return acc;

                    const info = gameData.info;
                    const bestDeal = gameData.cheapestPriceEver;
                    const sortedDeals = [...gameData.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    const currentBest = sortedDeals[0];

                    acc.push({
                        gameID: uniqueWishlist[idx],
                        title: info.title,
                        thumb: getHighResImage(info.thumb),
                        salePrice: currentBest ? currentBest.price : bestDeal.price,
                        normalPrice: currentBest ? currentBest.retailPrice : bestDeal.price,
                        savings: currentBest ? Math.round(parseFloat(currentBest.savings)) : 0,
                        storeID: currentBest ? currentBest.storeID : "1",
                    });

                    return acc;
                }, []);

                setSavedGames(validGames);
            } catch (error) {
                console.error("Failed to load wishlist games", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWishlistGames();
    }, [wishlist]);

    const bestDiscountGame = savedGames.length > 0 
        ? savedGames.reduce((prev, current) => (prev.savings > current.savings ? prev : current), savedGames[0])
        : null;

    const [sortMode, setSortMode] = useState<'discount' | 'price' | 'name'>('discount');

    const displayedGames = useMemo(() => {
        const sorted = [...savedGames];
        if (sortMode === 'discount') {
            sorted.sort((a, b) => b.savings - a.savings);
        } else if (sortMode === 'price') {
            sorted.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
        } else if (sortMode === 'name') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        }
        return sorted;
    }, [savedGames, sortMode]);

    const totalValue = useMemo(() => {
        return savedGames.reduce((acc, game) => acc + parseFloat(game.salePrice), 0).toFixed(2);
    }, [savedGames]);

    return (
        <main className="min-h-screen bg-background pb-12">
            <div className="container mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pt-12">
                <div className="relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-4xl border border-white/5 bg-surface p-8 shadow-2xl md:p-12">
                    {bestDiscountGame?.thumb && (
                        <div 
                            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity filter blur-xs"
                            style={{ backgroundImage: `url(${bestDiscountGame.thumb})` }}
                        />
                    )}
                    <div className="absolute inset-0 z-0 bg-linear-to-r from-background/90 to-background/40" />
                    <div className="relative z-10">
                        <h1 className="mb-2 text-4xl font-black tracking-tight text-white drop-shadow-md md:text-5xl">Meu Dashboard ❤️</h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            Gerencie seus jogos e alertas favoritos.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-white/10 pb-4">
                    <button 
                        className={cn(
                            "flex items-center gap-2 rounded-xl bg-transparent px-5 py-3 font-bold text-muted-foreground transition-all hover:bg-white/5 hover:text-white",
                            activeTab === 'wishlist' && "bg-white/10 text-white shadow-inner"
                        )}
                        onClick={() => setActiveTab('wishlist')}
                    >
                        <List size={20} />
                        Wishlist ({wishlist.length})
                    </button>
                    <button 
                        className={cn(
                            "flex items-center gap-2 rounded-xl bg-transparent px-5 py-3 font-bold text-muted-foreground transition-all hover:bg-white/5 hover:text-white",
                            activeTab === 'alerts' && "bg-white/10 text-white shadow-inner"
                        )}
                        onClick={() => setActiveTab('alerts')}
                    >
                        <Bell size={20} />
                        Meus Alertas ({alerts.length})
                    </button>
                </div>

                {activeTab === 'wishlist' ? (
                    isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-6 py-20">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-primary"></div>
                            <p className="text-sm font-medium text-muted-foreground">Carregando seus jogos...</p>
                        </div>
                    ) : savedGames.length > 0 ? (
                    <>
                        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-card/50 p-6 backdrop-blur-xl md:flex-row md:items-center">
                            <div className="flex flex-wrap gap-6 md:gap-12">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor da Carteira</span>
                                    <span className="text-2xl font-black text-white">${totalValue}</span>
                                </div>
                                {bestDiscountGame && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Maior Desconto</span>
                                        <span className="text-2xl font-black text-primary">-{bestDiscountGame.savings}%</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Ordenar por:</span>
                                    <select 
                                        value={sortMode} 
                                        onChange={(e) => setSortMode(e.target.value as 'discount' | 'price' | 'name')}
                                        className="cursor-pointer appearance-none bg-transparent text-sm font-bold text-white outline-hidden"
                                    >
                                        <option value="discount">Maior Desconto</option>
                                        <option value="price">Menor Preço</option>
                                        <option value="name">Ordem Alfabética</option>
                                    </select>
                                </div>

                                <button
                                    className="flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:scale-105 hover:bg-emerald-400 hover:shadow-[0_0_15px_hsl(var(--primary)/0.5)] active:scale-95"
                                    onClick={() => {
                                        const encoded = btoa(wishlist.join(','));
                                        const url = `${window.location.origin}/wishlist/shared?ids=${encoded}`;
                                        navigator.clipboard.writeText(url);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2500);
                                    }}
                                >
                                    {copied ? '✅ Link copiado!' : '🔗 Compartilhar Wishlist'}
                                </button>
                            </div>
                        </div>

                        <motion.div 
                            className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 lg:gap-8"
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                        >
                            {displayedGames.map((game, idx) => (
                                <motion.div 
                                    key={`${game.gameID}-${idx}`} 
                                    className="group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-card transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                    }}
                                >
                                    <div className="relative aspect-460/215 w-full overflow-hidden bg-black/50">
                                        <Image
                                            src={game.thumb}
                                            alt={game.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-end justify-between bg-linear-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <PriceAlertTrigger 
                                                gameID={game.gameID} 
                                                gameTitle={game.title} 
                                                currentPrice={parseFloat(game.salePrice)}
                                                className="w-auto! scale-90 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                                            />
                                            <HeartButton gameID={game.gameID} className="w-auto! scale-90 bg-black/60 opacity-0 transition-all duration-300 hover:bg-black/80 group-hover:scale-100 group-hover:opacity-100" />
                                        </div>
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
                                            <span className="rounded bg-white/5 px-2 py-1 text-xs font-semibold text-muted-foreground">{stores[game.storeID] || `Store ${game.storeID}`}</span>
                                            <Link href={`/game/${game.gameID}`} className="rounded bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Ver Detalhes</Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                ) : (
                    <motion.div 
                        className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/10 py-20 text-center"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                    >
                        <HeartCrack size={64} className="text-muted-foreground/30" />
                        <h2 className="text-2xl font-black text-white md:text-3xl">Sua lista está vazia :(</h2>
                        <p className="max-w-md text-sm text-muted-foreground">Volte para a página principal e clique no coração nos jogos que você deseja rastrear e acompanhar o preço&excl;</p>
                        <Link href="/" className="mt-2 rounded-lg bg-primary px-8 py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-1 hover:shadow-primary/50">Descobrir Ofertas Épicas</Link>
                    </motion.div>
                )) : (
                    /* ALERTS TAB */
                    alerts.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 lg:gap-8">
                            {alerts.map((alert) => (
                                <div key={alert.gameID} className="group flex flex-col overflow-hidden rounded-xl border border-primary/20 bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_10px_30px_rgba(0,191,165,0.15)]">
                                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-3 text-primary">
                                        <Bell size={16} className="animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Monitoramento Ativo</span>
                                    </div>
                                    <div className="flex flex-col p-5">
                                        <h3 className="mb-4 line-clamp-1 text-lg font-bold text-white" title={alert.gameTitle}>{alert.gameTitle}</h3>
                                        <div className="mb-6 flex gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alvo</span>
                                                <span className="text-2xl font-black text-primary">${alert.targetPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Atual</span>
                                                <span className="text-2xl font-black text-white">${alert.currentPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="mb-6 flex">
                                            <span className="rounded bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                                {alert.isKeyshopAllowed ? '✅ Inclui Keyshops' : '❌ Apenas Oficiais'}
                                            </span>
                                        </div>
                                        <div className="mt-auto flex items-center justify-between gap-3">
                                            <PriceAlertTrigger 
                                                gameID={alert.gameID} 
                                                gameTitle={alert.gameTitle} 
                                                currentPrice={alert.currentPrice}
                                                className="w-auto! bg-white/5! px-4! py-2! text-white! hover:bg-white/10!"
                                            />
                                            <Link href={`/game/${alert.gameID}`} className="flex items-center justify-center rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Ir para Jogo</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/10 py-20 text-center">
                            <Bell size={64} className="text-muted-foreground/30" />
                            <h2 className="text-2xl font-black text-white md:text-3xl">Nenhum alerta configurado</h2>
                            <p className="max-w-md text-sm text-muted-foreground">Abra a página de qualquer jogo e clique em &quot;Alert Me&quot; para ser notificado quando o preço baixar&excl;</p>
                        </div>
                    )
                )}
            </div>
        </main>
    );
}
