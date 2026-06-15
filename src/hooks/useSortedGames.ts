'use client';

import { useMemo } from 'react';

export interface SavedGame {
  gameID: string;
  title: string;
  thumb: string;
  salePrice: string;
  normalPrice: string;
  savings: number;
  storeID: string;
}

export function useSortedGames(
  savedGames: SavedGame[],
  sortMode: 'discount' | 'price' | 'name'
): SavedGame[] {
  return useMemo(() => {
    const sorted = [...savedGames];
    if (sortMode === 'discount') {
      sorted.sort((a, b) => b.savings - a.savings);
    } else if (sortMode === 'price') {
      sorted.sort((a, b) => Number.parseFloat(a.salePrice) - Number.parseFloat(b.salePrice));
    } else if (sortMode === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [savedGames, sortMode]);
}
