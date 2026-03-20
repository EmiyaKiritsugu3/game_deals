import { getDeals } from '@/services/api';
import HeroSection from '@/components/HeroSection';
import Freebies from '@/components/Freebies';
import FlashSales from '@/components/FlashSales';
import GameCard from '@/components/GameCard';
import DealRow from '@/components/DealRow';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch multiple distinct lists in parallel to mimic aggregator dashboard
  const [popular, bestDeals, recentDeals, flashDeals, freebies, historicalLows, endingSoon] = await Promise.all([
    getDeals({ pageSize: '5' }),                                       // Deal Rating (default)
    getDeals({ sortBy: 'Savings', pageSize: '10' }),                   // Highest discount %
    getDeals({ sortBy: 'Recent', pageSize: '10' }),                    // Newest deals
    getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }),         // Flash deals
    getDeals({ upperPrice: '0', pageSize: '6' }),                      // 100% OFF Freebies
    getDeals({ sortBy: 'Savings', pageSize: '10', lowerPrice: '0.01', upperPrice: '99', minimumMetacritic: '0' }), // Deep discounts (HL proxy)
    getDeals({ sortBy: 'Recent', pageSize: '8', onSale: '1' }),        // Ending soon (recent = turnover)
  ]);

  // Filter historical lows: savings above 70% as strong HL proxy
  const hlDeals = historicalLows.filter(d => parseFloat(d.savings) > 70).slice(0, 8);

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
                <a href="/search?sortBy=Recent" className={styles.seeAll}>SEE ALL ▶</a>
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
                <a href="/search?sortBy=Savings" className={styles.seeAll}>SEE ALL ▶</a>
              </div>
            </div>
            <div className={styles.listCol}>
              {bestDeals.map((deal) => (
                <DealRow key={deal.dealID} deal={deal} />
              ))}
            </div>
          </div>
        </div>

        {/* Historical Lows + Ending Soon */}
        {(hlDeals.length > 0 || endingSoon.length > 0) && (
          <div className={styles.splitLayout}>
            {hlDeals.length > 0 && (
              <div>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderRow}>
                    <div>
                      <h2><span className={styles.hlAccent}>HL</span> Historical Lows</h2>
                      <p>Prices at or near their all-time lowest.</p>
                    </div>
                    <a href="/search?sortBy=Savings" className={styles.seeAll}>SEE ALL ▶</a>
                  </div>
                </div>
                <div className={styles.listCol}>
                  {hlDeals.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                  ))}
                </div>
              </div>
            )}

            {endingSoon.length > 0 && (
              <div>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderRow}>
                    <div>
                      <h2>⏰ Ending Soon</h2>
                      <p>Act fast — these deals won't last.</p>
                    </div>
                    <a href="/search?sortBy=Recent" className={styles.seeAll}>SEE ALL ▶</a>
                  </div>
                </div>
                <div className={styles.listCol}>
                  {endingSoon.map((deal) => (
                    <DealRow key={deal.dealID} deal={deal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
