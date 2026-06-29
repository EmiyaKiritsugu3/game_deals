import { Suspense } from 'react';
import DealRow from '@/components/DealRow';
import EndingSoon from '@/components/EndingSoon';
import FlashSales from '@/components/FlashSales';
import Freebies from '@/components/Freebies';
import HistoricalLows from '@/components/HistoricalLows';
import CommunityListings from '@/components/home/CommunityListings';
import DiscoveryGrid from '@/components/home/DiscoveryGrid';
import HomeHero from '@/components/home/HomeHero';
import HotDealsSection from '@/components/home/HotDealsSection';
import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { normaliseDeal } from '@/lib/deal-utils';
import { getDeals } from '@/services/api';

// ISR: revalida a cada 1h
export const revalidate = 3600;

export default async function Home() {
  const [popular, bestDeals, recentDeals, flashDeals, freebies] = await Promise.all([
    getDeals({ pageSize: '5' }),
    getDeals({ sortBy: 'Savings', pageSize: '10' }),
    getDeals({ sortBy: 'Recent', pageSize: '10' }),
    getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }),
    getDeals({ upperPrice: '0', pageSize: '6' }),
  ]);

  const heroDeal = popular[0];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container">
        {/* Hero Section — featured deal with game art */}
        {heroDeal && <HomeHero deal={heroDeal} />}

        {/* Freebies + Flash Sales */}
        {freebies.length > 0 && <Freebies deals={freebies} />}
        <FlashSales deals={flashDeals} />

        {/* Hot Deals — horizontal scroll de top-rated */}
        <Suspense fallback={<div>Loading deals...</div>}>
          <HotDealsSection deals={popular} limit={10} />
        </Suspense>

        {/* New Deals + Best Deals */}
        <div className="grid grid-cols-2 gap-10 mb-12 items-start max-lg:grid-cols-1 max-lg:gap-8">
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                    New Deals
                  </h2>
                  <p className="text-sm text-muted-foreground">Just added to the tracker.</p>
                </div>
                <a
                  href="/search?sortBy=Recent"
                  className="text-xs font-semibold text-primary no-underline whitespace-nowrap tracking-wider shrink-0 hover:opacity-75"
                >
                  SEE ALL ▶
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2" aria-live="polite">
              {recentDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                    Best Deals
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Highest discount percentages available.
                  </p>
                </div>
                <a
                  href="/search?sortBy=Savings"
                  className="text-xs font-semibold text-primary no-underline whitespace-nowrap tracking-wider shrink-0 hover:opacity-75"
                >
                  SEE ALL ▶
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {bestDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>
        </div>

        {/* Discovery Grid — collections */}
        <Suspense fallback={<div>Loading collections...</div>}>
          <DiscoveryGrid />
        </Suspense>

        {/* Community Lists — public playlists */}
        <Suspense fallback={<div>Loading lists...</div>}>
          <CommunityListings />
        </Suspense>

        {/* Historical Lows + Ending Soon */}
        <div className="grid grid-cols-2 gap-10 mb-12 items-start max-lg:grid-cols-1 max-lg:gap-8">
          <Suspense fallback={<div>Loading...</div>}>
            <HistoricalLows />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <EndingSoon />
          </Suspense>
        </div>

        {/* Most Popular Games grid */}
        {popular.length > 1 && (
          <PopularDealsGrid deals={popular.slice(1).map((d) => normaliseDeal(d))} />
        )}
      </div>

      <footer className="mt-12 py-8 border-t border-border text-center text-sm text-muted-foreground">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} GameDeals</p>
          <p className="text-xs">Powered by CheapShark API</p>
        </div>
      </footer>
    </div>
  );
}
