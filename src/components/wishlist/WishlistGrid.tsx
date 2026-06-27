'use client';

import { HeartCrack } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import type { SavedGame } from '@/hooks/useSortedGames';

interface WishlistGridProps {
  readonly games: SavedGame[];
  readonly stores: Record<string, string>;
  readonly isLoading?: boolean;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
      <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p>Loading your games...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-8 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-lg gap-4 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
      <HeartCrack size={64} className="text-muted-foreground mb-2 opacity-50" />
      <h2>Your wishlist is empty :(</h2>
      <p>Go back main page and click heart on games you want to track and follow prices!</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold no-underline hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(220,38,38,0.4)] transition-all"
      >
        Discover Epic Deals
      </Link>
    </div>
  );
}

export default function WishlistGrid({ games, stores, isLoading = false }: WishlistGridProps) {
  if (isLoading) return <LoadingState />;
  if (games.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-sm:grid-cols-1">
      {games.map((game) => (
        <div
          key={game.gameID}
          className="bg-card rounded-lg overflow-hidden border border-border transition-all flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:border-primary"
        >
          <div className="relative w-full aspect-video">
            <Image
              src={game.thumb}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
            <HeartButton gameID={game.gameID} className="absolute top-2 left-2" />
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <PriceAlertTrigger
                gameID={game.gameID}
                gameTitle={game.title}
                currentPrice={Number.parseFloat(game.salePrice)}
                className="bg-card/90 backdrop-blur-sm w-9 h-9 p-0 justify-center rounded-full"
              />
            </div>
            {game.savings > 0 && (
              <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground font-extrabold px-2 py-1 rounded text-sm">
                -{game.savings}%
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-3 grow">
            <h3 className="text-lg font-bold m-0 text-foreground truncate" title={game.title}>
              {game.title}
            </h3>
            <div className="flex items-baseline gap-3">
              {game.savings > 0 && (
                <span className="line-through text-muted-foreground text-sm">
                  ${game.normalPrice}
                </span>
              )}
              <span className="text-xl font-extrabold text-foreground">${game.salePrice}</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
              <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                {stores[game.storeID] || `Store ${game.storeID}`}
              </span>
              <Link
                href={`/game/${game.gameID}`}
                className="text-xs font-bold text-primary no-underline hover:text-foreground"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
