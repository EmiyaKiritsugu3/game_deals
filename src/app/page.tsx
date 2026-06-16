import { Suspense } from 'react';
import DealRow from '@/components/DealRow';
import EndingSoon from '@/components/EndingSoon';
import FlashSales from '@/components/FlashSales';
import Freebies from '@/components/Freebies';
import GameCard from '@/components/GameCard';
import HeroSection from '@/components/HeroSection';
import HistoricalLows from '@/components/HistoricalLows';
import { getDeals } from '@/services/api';
import styles from './page.module.css';

// ISR: revalida a cada 1h
export const revalidate = 3600;

export default async function Home() {
  // Fetch primary static categories in parallel
  const [popular, bestDeals, recentDeals, flashDeals, freebies] = await Promise.all([
    getDeals({ pageSize: '5' }), // Deal Rating (default)
    getDeals({ sortBy: 'Savings', pageSize: '10' }), // Highest discount %
    getDeals({ sortBy: 'Recent', pageSize: '10' }), // Newest deals
    getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }), // Flash deals
    getDeals({ upperPrice: '0', pageSize: '6' }), // 100% OFF Freebies
  ]);

  const carouselDeals = popular.slice(0, 5);
  const gridDeals = popular.length > 5 ? popular.slice(5) : [];

  return (
    <main className={styles.main}>
      {carouselDeals.length > 0 && <HeroSection deals={carouselDeals} />}

      <div className="container">
        {freebies.length > 0 && <Freebies deals={freebies} />}
        <FlashSales deals={flashDeals} />

        {/* Most Popular Games */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2>Most Popular Games</h2>
              <p>The best and most sought-after discounts right now.</p>
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          {gridDeals.map((deal) => (
            <GameCard key={deal.dealID} deal={deal} />
          ))}
        </div>

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
            <div className={styles.listCol}>
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

        {/* Historical Lows + Ending Soon (Now modular) */}
        <div className={styles.splitLayout}>
          <Suspense fallback={null}>
            <HistoricalLows />
          </Suspense>
          <Suspense fallback={null}>
            <EndingSoon />
          </Suspense>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} GameDeals</p>
          <p className={styles.footerMuted}>Powered by CheapShark API</p>
        </div>
      </footer>
    </main>
  );
}
