'use client';

import { useMemo } from 'react';
import type { SavedGame } from './useSortedGames';

export function useWishlistStats(savedGames: SavedGame[]) {
  return useMemo(() => {
    if (savedGames.length === 0) {
      return { bestDiscountGame: null, totalValue: '0.00' };
    }

    let bestDiscountGame = savedGames[0];
    let total = 0;

    for (const game of savedGames) {
      if (game.savings >= bestDiscountGame.savings) {
        bestDiscountGame = game;
      }
      total += Number.parseFloat(game.salePrice);
    }

    return { bestDiscountGame, totalValue: total.toFixed(2) };
  }, [savedGames]);
}
