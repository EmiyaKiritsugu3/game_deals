'use client';

import { useEffect, useRef } from 'react';
import { getUserWishlistAction } from '@/actions/wishlist';
import { useWishlistSync } from '@/hooks/useSyncHooks';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

export default function SyncManager() {
  const { user, isLoggedIn } = useAuth();
  const { wishlist, setWishlist } = useWishlist();
  const hasMounted = useRef(false);
  const hasLoadedWishlist = useRef(false);

  // Track mount state for downstream hooks
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    hasMounted.current = true;
  }, [isLoggedIn, user]);

  // Cloud → local wishlist hydration when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user) {
      hasLoadedWishlist.current = false;
      return;
    }
    if (hasLoadedWishlist.current) return;
    hasLoadedWishlist.current = true;

    const loadCloudWishlist = async () => {
      try {
        const cloudIds = await getUserWishlistAction();
        if (cloudIds && cloudIds.length > 0) {
          const merged = [...new Set([...wishlist, ...cloudIds])];
          setWishlist(merged);
        }
      } catch {
        // Silently fail — user will still see local wishlist
      }
    };
    loadCloudWishlist();
  }, [isLoggedIn, user, wishlist, setWishlist]);

  useWishlistSync(hasMounted);

  return null;
}
