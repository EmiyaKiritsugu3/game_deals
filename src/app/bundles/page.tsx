import { BUNDLES } from '@/data/bundles';
import styles from './bundles.module.css';

export const metadata = {
  title: 'Game Bundles | GameDeals',
  description: 'Find the best game bundle deals from Humble Bundle, Fanatical, and more.',
};

export default function BundlesPage() {
  return (
    <main className="container">
      <div className={styles.bundlesPage}>
        <div className={styles.bundlesHeader}>
          <h1>🎁 Game Bundles</h1>
          <p>Multi-game packages from top stores — save up to 90% vs buying individually.</p>
        </div>

        <div className={styles.bundlesGrid}>
          {BUNDLES.map((bundle) => {
            const savings = Math.round(
              ((bundle.totalValue - bundle.price) / bundle.totalValue) * 100
            );
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(bundle.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div key={bundle.id} className={styles.bundleCard}>
                <div className={styles.bundleCardHeader}>
                  <div className={styles.bundleStoreInfo}>
                    <img
                      src={bundle.storeIcon}
                      alt={bundle.store}
                      width={20}
                      height={20}
                      className={styles.bundleStoreIcon}
                    />
                    <span className={styles.bundleStoreName}>{bundle.store}</span>
                  </div>
                  {bundle.tier && <span className={styles.bundleTier}>{bundle.tier}</span>}
                </div>

                <div className={styles.bundleBody}>
                  <h2 className={styles.bundleName}>{bundle.name}</h2>
                  <div className={styles.bundleGamesGrid}>
                    {bundle.games.map((game, gi) => (
                      <img
                        key={gi}
                        src={game.thumb}
                        alt={game.title}
                        title={`${game.title} — $${game.retailPrice.toFixed(2)}`}
                        className={styles.bundleGameThumb}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.bundleFooter}>
                  <div className={styles.bundlePricing}>
                    <span className={styles.bundlePrice}>${bundle.price.toFixed(2)}</span>
                    <span className={styles.bundleValue}>
                      {bundle.games.length} games · Value{' '}
                      <strong>${bundle.totalValue.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <a
                      href={bundle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.bundleCta}
                    >
                      -{savings}% · Get Bundle →
                    </a>
                    <span className={styles.bundleExpiry}>
                      {daysLeft > 0 ? `⏳ ${daysLeft} days left` : '⚠️ Expiring soon'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
