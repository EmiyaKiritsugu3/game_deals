'use client';

import { useState } from 'react';
import WishlistContent from '@/components/wishlist/WishlistContent';
import WishlistHero from '@/components/wishlist/WishlistHero';
import WishlistTabs from '@/components/wishlist/WishlistTabs';
import { useSortedGames } from '@/hooks/useSortedGames';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import { useWishlistSavedGames } from '@/hooks/useWishlistSavedGames';
import { useWishlistStats } from '@/hooks/useWishlistStats';
import { useAlerts } from '@/store/alertStore';
import { useWishlist } from '@/store/wishlistStore';
import styles from './page.module.css';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { alerts } = useAlerts();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'alerts'>('wishlist');
  const [sortMode, setSortMode] = useState<'discount' | 'price' | 'name'>('discount');
  const { data, isLoading } = useWishlistGames(wishlist);
  const stores = data?.stores ?? {};
  const gameResults = data?.games ?? [];
  const savedGames = useWishlistSavedGames(gameResults, wishlist);
  const { bestDiscountGame, totalValue } = useWishlistStats(savedGames);
  const displayedGames = useSortedGames(savedGames, sortMode);

  return (
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        <WishlistHero bestDiscountGame={bestDiscountGame} />
        <WishlistTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          wishlistCount={wishlist.length}
          alertsCount={alerts.length}
        />
        <WishlistContent
          activeTab={activeTab}
          isLoading={isLoading}
          savedGames={savedGames}
          displayedGames={displayedGames}
          stores={stores}
          alerts={alerts}
          bestDiscountGame={bestDiscountGame}
          totalValue={totalValue}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          wishlist={wishlist}
        />
      </div>
    </main>
  );
}
