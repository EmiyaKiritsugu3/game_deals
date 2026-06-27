'use client';

import type { SavedGame } from '@/hooks/useSortedGames';

interface WishlistHeroProps {
  readonly bestDiscountGame: SavedGame | null;
}

export default function WishlistHero({ bestDiscountGame }: WishlistHeroProps) {
  return (
    <div className="relative rounded-lg overflow-hidden py-12 px-8 flex flex-col justify-end min-h-[200px] mb-2 border border-border bg-card">
      {bestDiscountGame?.thumb && (
        <div
          className="absolute -inset-5 bg-cover bg-center [filter:blur(15px)_saturate(1.5)_brightness(0.6)] z-0"
          style={{ backgroundImage: `url(${bestDiscountGame.thumb})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-background/20 z-[1]" />
      <div className="relative z-[2] flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-foreground m-0">My Dashboard ❤️</h1>
        <p className="text-muted-foreground text-lg">Manage your favorite games and alerts.</p>
      </div>
    </div>
  );
}
