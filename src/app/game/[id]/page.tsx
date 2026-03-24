import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage, getStoreLogo } from '@/services/api';
import { ArrowLeft, Heart, Bell, TrendingDown, ExternalLink } from 'lucide-react';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [game, stores] = await Promise.all([
        getGame(id),
        getStores()
    ]);

    if (!game || !game.info) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-background pb-24 text-center space-y-4">
                <div className="container">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Game not found</h1>
                    <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft size={18} />
                        <span className="font-bold text-sm uppercase tracking-wider">Back to Deals</span>
                    </Link>
                </div>
            </main>
        );
    }

    const highResThumb = getHighResImage(game.info.thumb);

    // Sort deals by price ascending (best deal first)
    const sortedDeals = [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return (
        <main className="relative min-h-screen w-full bg-background pb-24">
            {/* LAYER 0: Full Bleed Atmospheric Glow */}
            <div className="absolute inset-0 z-0 h-[70vh] w-full overflow-hidden pointer-events-none">
                {/* Gradient mask to fade smoothly into pure OLED black */}
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />
                <Image
                    src={highResThumb}
                    alt="Atmosphere"
                    fill
                    className="object-cover blur-[100px] saturate-[1.5] opacity-50"
                    priority
                />
            </div>

            {/* LAYER 1: The Glass Dashboard */}
            <div className="container relative z-10 mx-auto px-4 max-w-6xl pt-24 md:pt-32">

                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1 -ml-2">
                    <ArrowLeft size={18} />
                    <span className="font-bold text-sm uppercase tracking-wider">Back to Deals</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 xl:gap-12">

                    {/* LEFT COLUMN: Art, Title, and Charts */}
                    <div className="space-y-8 lg:space-y-12">

                        {/* Game Presentation */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Main Cover Art */}
                            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0 bg-card">
                                <Image src={highResThumb} fill alt={game.info.title} className="object-cover" priority />
                            </div>

                            {/* Title & Actions */}
                            <div className="flex flex-col pt-2">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground drop-shadow-xl mb-6 leading-tight">
                                    {game.info.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-foreground hover:bg-white/10 hover:border-white/20 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                        <Heart size={18} className="text-muted-foreground" /> Add to Wishlist
                                    </button>
                                    <button className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 hover:border-primary/40 transition-all shadow-[0_0_15px_oklch(var(--color-primary)/0.15)] outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                        <Bell size={18} /> Price Alert
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Charts Placeholder - Glass Panel */}
                        <div className="rounded-3xl border border-white/5 bg-card/20 backdrop-blur-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3 text-foreground">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                        <TrendingDown size={20} className="text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Price History</h2>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-background/50 relative z-10">
                                <span className="font-mono text-sm text-muted-foreground uppercase tracking-widest">Chart Component Integration Pending</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: The Store Deals Ledger */}
                    <div className="space-y-6">
                        <div className="sticky top-32 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-white/5 bg-background/20">
                                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                    Available Deals
                                </h2>
                            </div>

                            <div className="p-4 md:p-6 space-y-3">
                                {sortedDeals.map((deal) => {
                                    const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
                                    const logo = getStoreLogo(deal.storeID);

                                    return (
                                        <a
                                            key={deal.dealID}
                                            href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 hover:shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-background/80 border border-white/10 flex items-center justify-center overflow-hidden relative shrink-0">
                                                    {logo ? (
                                                        <Image src={logo} alt={storeName} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-xs">{deal.storeID}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{storeName}</span>
                                                    <span className="text-xs font-semibold text-muted-foreground line-through">Retail: ${deal.retailPrice}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-xl text-foreground drop-shadow-md">${deal.price}</span>
                                                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:shadow-[0_0_15px_oklch(var(--color-primary)/0.4)]">
                                                    <ExternalLink size={18} />
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
