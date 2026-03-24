import { getDeals } from '../services/api';
import HeroSection from '@/components/HeroSection';
import GameCard from '@/components/GameCard';
import { Flame, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
    // Fetch deals from the API
    const deals = await getDeals();

    // Segment the data for different UI sections
    const heroDeals = deals.slice(0, 5);
    const trendingDeals = deals.slice(5, 15);
    const flashSales = deals.slice(15, 25);

    return (
        <main className="flex min-h-screen flex-col bg-background pb-24">
            {/* Phase 3: The 3D Hero Section */}
            <HeroSection deals={heroDeals} />

            <div className="container mx-auto px-4 max-w-7xl space-y-20 mt-8">

                {/* SECTION 1: Trending Grid (Standard Vertical Flow) */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_oklch(var(--color-primary)/0.2)]">
                                <Flame size={18} />
                            </span>
                            Trending Deals
                        </h2>
                        <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                            View All
                        </button>
                    </div>

                    {/* Phase 4: GameCards in a responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {trendingDeals.map(deal => (
                            <GameCard key={deal.dealID} deal={deal} />
                        ))}
                    </div>
                </section>

                {/* SECTION 2: Flash Sales (Native CSS Horizontal Carousel) */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                <Zap size={18} />
                            </span>
                            Flash Sales
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded">Ends Soon</span>
                        </div>
                    </div>

                    {/* Horizontal Snap Scroll Container - STRICT TAILWIND V4 */}
                    <div className="flex overflow-x-auto pb-8 -mx-4 px-4 gap-6 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {flashSales.map(deal => (
                            <div key={deal.dealID} className="min-w-[280px] sm:min-w-[320px] snap-start">
                                <GameCard deal={deal} />
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
}
