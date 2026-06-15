'use client';

import { useMemo } from 'react';
import { getHighResImage } from '@/services/api';
import type { GameDetails } from '@/types/game';
import type { SavedGame } from './useSortedGames';

export function useWishlistSavedGames(
  gameResults: Array<GameDetails | null>,
  wishlist: string[]
): SavedGame[] {
  return useMemo(
    () =>
      gameResults.reduce((acc, g, idx) => {
        if (!g?.info) return acc;
        const best = [...g.deals].sort(
          (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
        )[0];
        acc.push({
          gameID: wishlist[idx],
          title: g.info.title,
          thumb: getHighResImage(g.info.thumb),
          salePrice: best ? best.price : g.cheapestPriceEver.price,
          normalPrice: best ? best.retailPrice : g.cheapestPriceEver.price,
          savings: best ? Math.round(Number.parseFloat(best.savings)) : 0,
          storeID: best ? best.storeID : '1',
        });
        return acc;
      }, [] as SavedGame[]),
    [gameResults, wishlist]
  );
}
