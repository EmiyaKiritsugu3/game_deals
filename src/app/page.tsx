import { Suspense } from 'react';
import DealRow from '@/components/DealRow';
import EndingSoon from '@/components/EndingSoon';
import FlashSales from '@/components/FlashSales';
import Freebies from '@/components/Freebies';
import GameCard from '@/components/GameCard';
import HistoricalLows from '@/components/HistoricalLows';
import CommunityListings from '@/components/home/CommunityListings';
import DiscoveryGrid from '@/components/home/DiscoveryGrid';
import HomeHero from '@/components/home/HomeHero';
import HotDealsSection from '@/components/home/HotDealsSection';
import { getDeals } from '@/services/api';
import styles from './page.module.css';

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
    <div className={styles.main}>
      <div className="container">
        {/* Hero Section — featured deal with game art */}
        {heroDeal && <HomeHero deal={heroDeal} />}

        {/* Freebies + Flash Sales */}
        {freebies.length > 0 && <Freebies deals={freebies} />}
        <FlashSales deals={flashDeals} />

        {/* Hot Deals — horizontal scroll de top-rated */}
        <Suspense fallback={<div className={styles.skeleton}>Loading deals...</div>}>
          <HotDealsSection deals={popular} limit={10} />
        </Suspense>

        {/* New Deals + Best Deals */}
        <div className={styles.splitLayout}>
          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h2>New Deals</h2>
                  <p>Just added to the tracker.</p>
                </div>
                <a href="/search?sortBy=Recent" className={styles.seeAll}>
                  SEE ALL ▶
                </a>
              </div>
            </div>
            <div className={styles.listCol} aria-live="polite">
              {recentDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>

          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h2>Best Deals</h2>
                  <p>Highest discount percentages available.</p>
                </div>
                <a href="/search?sortBy=Savings" className={styles.seeAll}>
                  SEE ALL ▶
                </a>
              </div>
            </div>
            <div className={styles.listCol}>
              {bestDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>
        </div>

        {/* Discovery Grid — collections */}
        <Suspense fallback={<div className={styles.skeleton}>Loading collections...</div>}>
          <DiscoveryGrid />
        </Suspense>

        {/* Community Lists — public playlists */}
        <Suspense fallback={<div className={styles.skeleton}>Loading lists...</div>}>
          <CommunityListings />
        </Suspense>

        {/* Historical Lows + Ending Soon */}
        <div className={styles.splitLayout}>
          <Suspense fallback={<div className={styles.skeleton}>Loading...</div>}>
            <HistoricalLows />
          </Suspense>
          <Suspense fallback={<div className={styles.skeleton}>Loading...</div>}>
            <EndingSoon />
          </Suspense>
        </div>

        {/* Most Popular Games grid */}
        {popular.length > 1 && (
          <div>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h2>Most Popular Games</h2>
                  <p>The best and most sought-after discounts right now.</p>
                </div>
              </div>
            </div>
            <div className={styles.grid}>
              {popular.slice(1).map((deal) => (
                <GameCard key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} GameDeals</p>
          <p className={styles.footerMuted}>Powered by CheapShark API</p>
        </div>
      </footer>
    </div>
  );
}
