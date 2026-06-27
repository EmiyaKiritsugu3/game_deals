import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COLLECTIONS } from '@/data/collections';
import { getGame } from '@/services/api';

interface CollectionGame {
  gameID: string;
  title: string;
  thumb: string;
  price: string;
  retailPrice: string;
}

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

  // Fetch all games in the collection in parallel
  const gamesData = await Promise.all(
    collection.gameIDs.map((id) => getGame(id).catch(() => null))
  );

  const games = gamesData.reduce((acc: CollectionGame[], gameData, idx) => {
    if (!gameData?.info) return acc;
    const bestDeal = [...gameData.deals].sort(
      (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
    )[0];
    acc.push({
      gameID: collection.gameIDs[idx],
      title: gameData.info.title,
      thumb: gameData.info.thumb,
      price: bestDeal?.price ?? gameData.cheapestPriceEver.price,
      retailPrice: bestDeal?.retailPrice ?? gameData.cheapestPriceEver.price,
    });
    return acc;
  }, [] as CollectionGame[]);

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

        <div className="grid gap-4">
          {games.map((game: CollectionGame) => {
            return (
              <div
                key={game.gameID}
                className="flex items-center gap-4 bg-card border border-border rounded-lg p-3 px-4 hover:border-primary"
              >
                <Image
                  src={game.thumb}
                  alt={game.title}
                  width={120}
                  height={56}
                  className="rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{game.title}</div>
                  <div className="text-sm text-primary font-extrabold">
                    {Number.parseFloat(game.price) === 0 ? 'FREE' : `$${game.price}`}
                    {Number.parseFloat(game.retailPrice) > Number.parseFloat(game.price) && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: 'hsl(var(--muted-foreground))',
                          marginLeft: '0.5rem',
                          fontWeight: 400,
                        }}
                      >
                        ${game.retailPrice}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/game/${game.gameID}`}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-bold text-xs no-underline whitespace-nowrap hover:opacity-85"
                >
                  View Deal →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
