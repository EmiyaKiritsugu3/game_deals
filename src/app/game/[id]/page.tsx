import type { Metadata } from 'next';
import Image from 'next/image';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import {
  type GameDeal,
  getDrmType,
  getGame,
  getHighResImage,
  getStoreLogo,
  getStores,
  isGreyMarketStore,
} from '@/services/api';
import { calculateCostPerHour, estimatePlaytime } from '@/services/hltb';
import styles from './page.module.css';

const SITE_URL = 'https://gamedeals.com.br';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);

  if (!game?.info) {
    return { title: 'Game Not Found' };
  }

  const bestPrice = [...game.deals]
    .sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))[0];

  const title = `${game.info.title} — Best Price: $${bestPrice?.price || 'N/A'}`;
  const description = `Find the best deal for ${game.info.title}. Current lowest price: $${bestPrice?.price || 'N/A'}. Historical low: $${game.cheapestPriceEver.price}. Compare prices across ${game.deals.length} stores.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/game/${id}`,
      siteName: 'GameDeals',
      images: [
        {
          url: getHighResImage(game.info.thumb),
          width: 600,
          height: 300,
          alt: game.info.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getHighResImage(game.info.thumb)],
    },
    alternates: {
      canonical: `${SITE_URL}/game/${id}`,
    },
  };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, stores] = await Promise.all([getGame(id), getStores()]);

  if (!game?.info) {
    return (
      <main className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>Game not found</h1>
        <p>The game you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </main>
    );
  }

  const highResThumb = getHighResImage(game.info.thumb);
  const sortedDeals = [...game.deals].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price));
  const cheapestEver = Number.parseFloat(game.cheapestPriceEver.price);
  const bestCurrentPrice = Number.parseFloat(sortedDeals[0]?.price ?? '9999');
  const isCurrentlyAtHL = bestCurrentPrice <= cheapestEver * 1.05;

  const playtime = estimatePlaytime(game.info.title);
  const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);

  const renderDealRow = (deal: GameDeal, isBest: boolean) => {
    const savings = Math.round(Number.parseFloat(deal.savings));
    const price = Number.parseFloat(deal.price);
    const logo = getStoreLogo(deal.storeID);
    const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
    const isDealAtHL = price <= cheapestEver * 1.05;
    const isFree = price === 0;

    return (
      <a
        key={deal.dealID}
        href={`/out?url=${encodeURIComponent(
          deal.dealID.startsWith('grey-')
            ? `https://www.${storeName.toLowerCase().replace(/\s+/g, '')}.com/search?q=${encodeURIComponent(game.info.title)}`
            : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
        )}&store=${encodeURIComponent(storeName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.dealRow} ${isBest ? styles.dealRowBest : ''}`}
      >
        <div className={styles.storeInfo}>
          {logo ? (
            <img src={logo} alt={storeName} className={styles.storeLogo} width={18} height={18} />
          ) : (
            <div className={styles.storeLogoPlaceholder} />
          )}
          <span className={styles.storeName}>{storeName}</span>
          {isBest && <span className={styles.bestTag}>BEST</span>}
          <span className="drmBadge">
            {getDrmType(deal.storeID).icon} {getDrmType(deal.storeID).label}
          </span>
        </div>

        <div className={styles.dealPriceInfo}>
          {isDealAtHL && <span className={styles.hlBadge}>HL</span>}
          {savings > 0 && !isFree && <div className={styles.savingsBadge}>-{savings}%</div>}
          <div className={styles.prices}>
            {savings > 0 && !isFree && <span className={styles.retail}>${deal.retailPrice}</span>}
            {isFree ? (
              <span className={styles.freePrice}>FREE</span>
            ) : (
              <span className={styles.price}>${deal.price}</span>
            )}
          </div>
        </div>
      </a>
    );
  };

  const officialDeals = sortedDeals.filter((d) => !isGreyMarketStore(d.storeID));
  const keyshopDeals = sortedDeals.filter((d) => isGreyMarketStore(d.storeID));

  // JSON-LD for product
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.info.title,
    image: highResThumb,
    description: `Best price for ${game.info.title} across all digital stores.`,
    offers: sortedDeals.slice(0, 5).map((deal) => ({
      '@type': 'Offer',
      price: deal.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: stores[deal.storeID] || 'Unknown Store',
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <main className="container">
        <div className={styles.gamePage}>
          <div className={styles.gameHero}>
            <Image
              src={highResThumb}
              alt={game.info.title}
              width={600}
              height={300}
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <h1 className={styles.title}>{game.info.title}</h1>
              <div className={styles.actionButtons}>
                <PriceAlertTrigger
                  gameID={id}
                  gameTitle={game.info.title}
                  currentPrice={bestCurrentPrice}
                />
                <HeartButton gameID={id} className={styles.heartBtn} />
              </div>
            </div>
          </div>

          <div className={styles.contentBody}>
            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Best Price Now</span>
                <span className={styles.statValue}>
                  {bestCurrentPrice === 0 ? (
                    <span className={styles.freeTag}>FREE</span>
                  ) : (
                    `$${sortedDeals[0]?.price}`
                  )}
                </span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Historical Low</span>
                <span className={`${styles.statValue} ${styles.hlValue}`}>
                  ${game.cheapestPriceEver.price}
                  {isCurrentlyAtHL && <span className={styles.hlActiveBadge}>LIVE HL</span>}
                </span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>🎮 Value</span>
                <span className={styles.statValue}>{costPerHour}</span>
                <span className={styles.statSub}>~{playtime.mainStory}h campaign</span>
              </div>
            </div>

            <div className={styles.storeComparison}>
              {officialDeals.length > 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Official Stores</h2>
                  <div className={styles.dealsList}>
                    {officialDeals.map((deal) =>
                      renderDealRow(deal, Number.parseFloat(deal.price) === Number.parseFloat(officialDeals[0]?.price))
                    )}
                  </div>
                </>
              )}

              {keyshopDeals.length > 0 && (
                <>
                  <h2 className={`${styles.sectionTitle} ${styles.keyshopTitle}`}>Keyshops</h2>
                  <div className={styles.dealsList}>
                    {keyshopDeals.map((deal) =>
                      renderDealRow(deal, Number.parseFloat(deal.price) === Number.parseFloat(keyshopDeals[0]?.price))
                    )}
                  </div>
                </>
              )}
            </div>

            <DynamicPriceHistory
              currentPrice={sortedDeals[0]?.price || game.cheapestPriceEver.price}
              lowestPrice={game.cheapestPriceEver.price}
              lowestDate={game.cheapestPriceEver.date}
              retailPrice={sortedDeals[0]?.retailPrice}
              gameTitle={game.info.title}
              gameId={id}
            />

            <DynamicStoreCompare
              data={sortedDeals.map((d) => ({
                storeName: stores[d.storeID] || `Store ${d.storeID}`,
                price: d.price,
              }))}
            />
          </div>
        </div>
      </main>
    </>
  );
}
