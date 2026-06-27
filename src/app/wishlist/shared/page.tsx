'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import { buildSharedGamesList, decodeSharedWishlistIds, type GameEntry } from '@/lib/wishlist-data';

function EmptySharedState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
      <h2>Wishlist not found</h2>
      <p>The link may be expired or invalid.</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold no-underline transition-transform"
      >
        Go to Home
      </Link>
    </div>
  );
}

function SharedGameCard({
  game,
  stores,
}: Readonly<{ game: GameEntry; stores: Record<string, string> }>) {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border flex flex-col">
      <div className="relative w-full aspect-video">
        <Image src={game.thumb} alt={game.title} fill sizes="(max-width: 768px) 100vw, 33vw" />
        {game.savings > 0 && (
          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground font-extrabold px-2 py-1 rounded text-sm">
            -{game.savings}%
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 grow">
        <h3 className="text-lg font-bold text-foreground truncate" title={game.title}>
          {game.title}
        </h3>
        <div className="flex items-baseline gap-3">
          {game.savings > 0 && (
            <span className="line-through text-muted-foreground text-sm">${game.normalPrice}</span>
          )}
          <span className="text-xl font-extrabold text-foreground">${game.salePrice}</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
            {stores[game.storeID] || 'Store'}
          </span>
          <Link
            href={`/game/${game.gameID}`}
            className="text-sm font-bold text-primary no-underline"
          >
            🎁 Buy as Gift
          </Link>
        </div>
      </div>
    </div>
  );
}

function SharedWishlistContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
  const gameIds = useMemo(() => decodeSharedWishlistIds(idsParam), [idsParam]);
  const { data, isLoading } = useWishlistGames(gameIds);
  const [stores, setStores] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data?.stores) setStores(data.stores);
  }, [data?.stores]);
  const games = useMemo(() => buildSharedGamesList(data, gameIds), [data, gameIds]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p>Loading shared wishlist...</p>
      </div>
    );

  if (games.length === 0) return <EmptySharedState />;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl mb-8 min-h-[300px] flex items-center justify-center">
        {games[0]?.thumb && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${games[0].thumb})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 text-center py-16 px-4">
          <h1 className="text-4xl font-bold text-foreground mb-2">🎁 Shared Wishlist</h1>
          <p className="text-lg text-muted-foreground">
            {games.length} {games.length === 1 ? 'game' : 'games'} in this list &middot; Gift using
            the links below!
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {games.map((game) => (
          <SharedGameCard key={game.gameID} game={game} stores={stores} />
        ))}
      </div>
    </>
  );
}

export default function SharedWishlistPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="container flex flex-col gap-8">
        <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>}>
          <SharedWishlistContent />
        </Suspense>
      </div>
    </main>
  );
}
