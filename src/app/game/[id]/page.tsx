import type { Metadata } from 'next';
import GameBody from '@/components/game/GameBody';
import { buildGameStats, sortDealsByPrice, splitDealsByGreyMarket } from '@/lib/game-data';
import {
  buildOG,
  buildTwitter,
  extractDescription,
  extractTitle,
  SITE_URL,
} from '@/lib/metadata-helpers';
import { getGame, getHighResImage, getStores, isGreyMarketStore } from '@/services/api';
import { getCheapestDeal } from '@/utils/pricing';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);

  if (!game?.info) {
    return { title: 'Game Not Found' };
  }

  const bestDeal = getCheapestDeal(game.deals);
  const bestPrice = bestDeal?.price;
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

export default async function GamePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const [game, stores] = await Promise.all([getGame(id), getStores()]);

  if (!game?.info) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>Game not found</h1>
        <p>The game you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  const highResThumb = getHighResImage(game.info.thumb);
  const bestDeal = getCheapestDeal(game.deals);
  const sortedDeals = sortDealsByPrice(game.deals);
  const bestCurrentPrice = Number.parseFloat(bestDeal?.price ?? '9999');
  const { official, keyshop } = splitDealsByGreyMarket(sortedDeals, isGreyMarketStore);
  const stats = buildGameStats(game, bestCurrentPrice);

  const viewModel = {
    gameTitle: game.info.title,
    highResThumb,
    bestRawPrice: bestDeal?.price ?? '0',
    stats,
    official,
    keyshop,
    cheapestEverDate: game.cheapestPriceEver.date,
    stores,
  };

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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <div className="container">
        <GameBody viewModel={viewModel} id={id} />
      </div>
    </>
  );
}
