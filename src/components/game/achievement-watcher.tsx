'use client';

import * as React from 'react';
import { useAchievements } from '@/store/achievements';
import { useCompare } from '@/store/compare';
import { useWishlist } from '@/store/wishlist';

/**
 * Wires achievement triggers into the existing wishlist + compare stores.
 * Mount this once at the app root (e.g. in page.tsx). It has no UI — it just
 * subscribes to store changes and increments achievement progress.
 *
 * Triggers:
 *  - first-wishlist / wishlist-5 / wishlist-25: count of wishlisted items
 *  - free-claimer / free-5: count of wishlisted items that are free
 *  - compare-1 / compare-3: count of items in the compare tray
 */
export function AchievementWatcher() {
  const wishlistItems = useWishlist((s) => s.items);
  const compareItems = useCompare((s) => s.items);
  const setCount = useAchievements((s) => s.setCount);

  // Track wishlist-based achievements
  React.useEffect(() => {
    setCount('first-wishlist', wishlistItems.length);
    setCount('wishlist-5', wishlistItems.length);
    setCount('wishlist-25', wishlistItems.length);
    // Free-games count
    const freeCount = wishlistItems.filter((i) => Number(i.salePrice) === 0).length;
    setCount('free-claimer', freeCount);
    setCount('free-5', freeCount);
  }, [wishlistItems, setCount]);

  // Track compare-based achievements
  React.useEffect(() => {
    setCount('compare-1', compareItems.length);
    setCount('compare-3', compareItems.length);
  }, [compareItems, setCount]);

  return null;
}
