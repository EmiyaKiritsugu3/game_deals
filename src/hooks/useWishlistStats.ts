'use client';

import { useMemo } from 'react';
import type { SavedGame } from './useSortedGames';

export function useWishlistStats(savedGames: SavedGame[]) {
  const bestDiscountGame = useMemo(() => {
    return savedGames.length > 0
      ? savedGames.reduce(
          (prev, current) => (prev.savings > current.savings ? prev : current),
          savedGames[0]
        )
      : null;
  }, [savedGames]);

  const totalValue = useMemo(() => {
    return savedGames.reduce((acc, game) => acc + Number.parseFloat(game.salePrice), 0).toFixed(2);
  }, [savedGames]);

  return { bestDiscountGame, totalValue };
}
