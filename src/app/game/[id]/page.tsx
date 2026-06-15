import type { Metadata } from 'next';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import GameHero from '@/components/game/GameHero';
import GameStatsRow from '@/components/game/GameStatsRow';
import StoreComparison from '@/components/game/StoreComparison';
import { buildGameStats, sortDealsByPrice, splitDealsByGreyMarket } from '@/lib/game-data';
import {
  buildOG,
  buildTwitter,
  extractDescription,
  extractTitle,
  SITE_URL,
} from '@/lib/metadata-helpers';
import { getGame, getHighResImage, getStores, isGreyMarketStore } from '@/services/api';
import { calculateCostPerHour, estimatePlaytime } from '@/services/hltb';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);

  if (!game?.info) {
    return { title: 'Game Not Found' };
  }

  const sortedDeals = sortDealsByPrice(game.deals);
  const bestPrice = sortedDeals[0]?.price;
  const title = extractTitle(game.info.title, bestPrice);
  const description = extractDescription(
    game.info.title,
    bestPrice,
    game.cheapestPriceEver.price,
    game.deals.length
  );

  return {
    title,
    description,
    openGraph: buildOG(title, description, game.info.thumb, id),
    twitter: buildTwitter(title, description, game.info.thumb),
    alternates: { canonical: `${SITE_URL}/game/${id}` },
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
  const sortedDeals = sortDealsByPrice(game.deals);
  const bestCurrentPrice = Number.parseFloat(sortedDeals[0]?.price ?? '9999');
  const { official, keyshop } = splitDealsByGreyMarket(sortedDeals, isGreyMarketStore);
  const stats = buildGameStats(game, bestCurrentPrice);
  const playtime = estimatePlaytime(game.info.title);
  const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);

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
        <GameHero
          gameId={id}
          gameTitle={game.info.title}
          thumb={highResThumb}
          bestCurrentPrice={bestCurrentPrice}
          priority
        />

        <GameStatsRow
          bestCurrentPrice={stats.bestCurrentPrice}
          isFree={stats.isFree}
          bestRawPrice={sortedDeals[0]?.price ?? '0'}
          cheapestEver={stats.cheapestEver}
          isCurrentlyAtHL={stats.isCurrentlyAtHL}
          costPerHour={costPerHour}
          playtimeMain={playtime.mainStory}
        />

        <StoreComparison
          officialDeals={official}
          keyshopDeals={keyshop}
          cheapestEver={stats.cheapestEver}
          gameTitle={game.info.title}
          stores={stores}
        />

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
      </main>
    </>
  );
}
