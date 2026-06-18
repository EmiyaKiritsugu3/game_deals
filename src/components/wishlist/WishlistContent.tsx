'use client';

import type { SavedGame } from '@/hooks/useSortedGames';
import type { PriceAlert } from '@/types/price-alert';
import AlertsGrid from './AlertsGrid';
import WishlistGrid from './WishlistGrid';
import WishlistStats from './WishlistStats';

interface WishlistContentProps {
  readonly activeTab: 'wishlist' | 'alerts';
  readonly isLoading: boolean;
  readonly savedGames: SavedGame[];
  readonly displayedGames: SavedGame[];
  readonly stores: Record<string, string>;
  readonly alerts: PriceAlert[];
  readonly bestDiscountGame: SavedGame | null;
  readonly totalValue: string;
  readonly sortMode: 'discount' | 'price' | 'name';
  readonly onSortModeChange: (mode: 'discount' | 'price' | 'name') => void;
  readonly wishlist: string[];
}

export default function WishlistContent({
  activeTab,
  isLoading,
  savedGames,
  displayedGames,
  stores,
  alerts,
  bestDiscountGame,
  totalValue,
  sortMode,
  onSortModeChange,
  wishlist,
}: WishlistContentProps) {
  if (activeTab !== 'wishlist') {
    return <AlertsGrid alerts={alerts} />;
  }
  if (isLoading) {
    return <WishlistGrid games={[]} stores={stores} isLoading />;
  }
  if (savedGames.length === 0) {
    return <WishlistGrid games={[]} stores={stores} />;
  }
  return (
    <>
      <WishlistStats
        totalValue={totalValue}
        bestDiscountGame={bestDiscountGame}
        sortMode={sortMode}
        onSortModeChange={onSortModeChange}
        wishlist={wishlist}
      />
      <WishlistGrid games={displayedGames} stores={stores} />
    </>
  );
}
