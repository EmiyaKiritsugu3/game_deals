import { getDeals } from '@/services/api';
import HeroSection from '@/components/HeroSection';
import Freebies from '@/components/Freebies';
import FlashSales from '@/components/FlashSales';
import GameCard from '@/components/GameCard';
import DealRow from '@/components/DealRow';

export const dynamic = 'force-dynamic';

import HistoricalLows from '@/components/HistoricalLows';
import EndingSoon from '@/components/EndingSoon';
import { ActivityFeed } from '@/components/ActivityFeed';
import Link from 'next/link';

export default async function Home() {
  // Fetch primary static categories in parallel
  const [popular, bestDeals, recentDeals, flashDeals, freebies] = await Promise.all([
    getDeals({ pageSize: '5' }),                                       // Deal Rating (default)
    getDeals({ sortBy: 'Savings', pageSize: '10' }),                   // Highest discount %
    getDeals({ sortBy: 'Recent', pageSize: '10' }),                    // Newest deals
    getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }),         // Flash deals
    getDeals({ upperPrice: '0', pageSize: '6' }),                      // 100% OFF Freebies
  ]);

  const carouselDeals = popular.slice(0, 5);
  const gridDeals = popular.length > 5 ? popular.slice(5) : [];

  return (
    <main className="min-h-screen pb-12">
      {carouselDeals.length > 0 && <HeroSection deals={carouselDeals} />}

      <div className="container flex flex-col gap-12">
        {freebies.length > 0 && <Freebies deals={freebies} />}
        <FlashSales deals={flashDeals} />

        {/* Most Popular Games */}
        <section>
          <div className="mb-6 flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">Most Popular Games</h2>
              <p className="text-sm font-medium text-muted-foreground">The best and most sought-after discounts right now.</p>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 lg:gap-8">
            {gridDeals.map((deal) => (
              <GameCard key={deal.dealID} deal={deal} />
            ))}
          </div>
        </section>

        {/* New Deals + Best Deals */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-6 flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">New Deals</h2>
                <p className="text-sm font-medium text-muted-foreground">Just added to the tracker.</p>
              </div>
              <Link href="/search?sortBy=Recent" className="shrink-0 text-sm font-bold text-primary transition-colors hover:text-emerald-400">SEE ALL ▶</Link>
            </div>
            <div className="flex flex-col gap-4">
              {recentDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 flex flex-col items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">Best Deals</h2>
                <p className="text-sm font-medium text-muted-foreground">Highest discount percentages available.</p>
              </div>
              <Link href="/search?sortBy=Savings" className="shrink-0 text-sm font-bold text-primary transition-colors hover:text-emerald-400">SEE ALL ▶</Link>
            </div>
            <div className="flex flex-col gap-4">
              {bestDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>
        </div>

        {/* Historical Lows + Ending Soon (Now modular) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <HistoricalLows />
          <EndingSoon />
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      <footer className="mt-20 border-t border-white/10 bg-black/40 py-12 text-center md:text-left">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-bold text-white">© {new Date().getFullYear()} GameDeals</p>
          <p className="text-sm font-medium text-muted-foreground">Powered by CheapShark API</p>
        </div>
      </footer>
    </main>
  );
}
