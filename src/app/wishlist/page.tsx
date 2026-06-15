'use client';

import { useMemo, useState } from 'react';
import AlertsGrid from '@/components/wishlist/AlertsGrid';
import WishlistGrid from '@/components/wishlist/WishlistGrid';
import WishlistHero from '@/components/wishlist/WishlistHero';
import WishlistStats from '@/components/wishlist/WishlistStats';
import WishlistTabs from '@/components/wishlist/WishlistTabs';
import { type SavedGame, useSortedGames } from '@/hooks/useSortedGames';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import { useWishlistStats } from '@/hooks/useWishlistStats';
import { getHighResImage } from '@/services/api';
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
  const savedGames: SavedGame[] = useMemo(
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
        {activeTab === 'wishlist' ? (
          isLoading ? (
            <WishlistGrid games={[]} stores={stores} isLoading />
          ) : savedGames.length > 0 ? (
            <>
              <WishlistStats
                totalValue={totalValue}
                bestDiscountGame={bestDiscountGame}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                wishlist={wishlist}
              />
              <WishlistGrid games={displayedGames} stores={stores} />
            </>
          ) : (
            <WishlistGrid games={[]} stores={stores} />
          )
        ) : (
          <AlertsGrid alerts={alerts} />
        )}
      </div>
    </main>
  );
}
