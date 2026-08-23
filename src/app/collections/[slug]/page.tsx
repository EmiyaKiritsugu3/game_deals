import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PopularDealsGrid } from '@/components/home/PopularDealsGrid';
import { COLLECTIONS } from '@/data/collections';
import { normaliseDeal } from '@/lib/deal-utils';
import type { DealWithStore } from '@/lib/types';
import { getGamesBatch } from '@/services/api';
import type { Deal, GameDetails } from '@/types/game';
import { getCheapestDeal } from '@/utils/pricing';

export async function generateStaticParams() {
  return COLLECTIONS.map((col) => ({ slug: col.slug }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const collection = COLLECTIONS.find((c) => c.slug === slug);
  if (!collection) return { title: 'Not Found' };
  return {
    title: `${collection.title} | GameDeals Collections`,
    description: collection.description,
  };
}

function gameDataToDeal(gameData: GameDetails, gameID: string): DealWithStore {
  // ⚡ Bolt: Use O(N) getCheapestDeal instead of O(N log N) sorting to prevent
  // unnecessary array allocation and CPU overhead during batch processing.
  const bestDeal = getCheapestDeal(gameData.deals);
  const deal: Deal = {
    internalName: gameID,
    title: gameData.info.title,
    metacriticLink: '',
    dealID: `col-${gameID}`,
    storeID: bestDeal?.storeID ?? '0',
    gameID,
    salePrice: bestDeal?.price ?? gameData.cheapestPriceEver.price,
    normalPrice: bestDeal?.retailPrice ?? gameData.cheapestPriceEver.price,
    isOnSale: '1',
    savings: bestDeal?.savings ?? '0',
    metacriticScore: '0',
    steamRatingText: '',
    steamRatingPercent: '0',
    steamRatingCount: '0',
    steamAppID: '',
    releaseDate: 0,
    lastChange: 0,
    dealRating: bestDeal?.dealRating ?? '0',
    thumb: gameData.info.thumb,
  };
  return normaliseDeal(deal);
}

export default async function CollectionDetailPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const collection = COLLECTIONS.find((c) => c.slug === slug);

  if (!collection) {
    notFound();
  }

  const gamesData = await getGamesBatch(collection.gameIDs);

  const deals = collection.gameIDs.reduce((acc: DealWithStore[], gameID) => {
    const gameData = gamesData[gameID];
    if (!gameData?.info) return acc;
    acc.push(gameDataToDeal(gameData, gameID));
    return acc;
  }, [] as DealWithStore[]);

  return (
    <main className="container">
      <div className="pt-8 pb-16">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground no-underline hover:text-primary"
        >
          ← Back to Collections
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl mb-1">
            {collection.emoji} {collection.title}
          </h1>
          <p className="text-muted-foreground">{collection.description}</p>
        </div>

        <PopularDealsGrid deals={deals} />
      </div>
    </main>
  );
}
