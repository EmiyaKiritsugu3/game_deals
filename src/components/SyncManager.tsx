'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

export default function SyncManager() {
  const { user, isLoggedIn } = useAuth();
  const { wishlist, setWishlist } = useWishlist();
  const { alerts } = useAlerts();
  const hasLoadedFromCloud = useRef(false);

  // 1. Carregar wishlist do cloud quando loga
  useEffect(() => {
    if (!isLoggedIn || !user || hasLoadedFromCloud.current) return;

    const loadFromCloud = async () => {
      const { data } = await supabase
        ?.from('wishlists')
        .select('gameId')
        .eq('userId', user.id);

      if (data && data.length > 0) {
        const cloudIds = data.map((r: any) => r.gameId);
        // Merge: cloud + local (sem duplicatas)
        const merged = [...new Set([...wishlist, ...cloudIds])];
        setWishlist(merged);
      }
      hasLoadedFromCloud.current = true;
    };

    loadFromCloud();
  }, [isLoggedIn, user]);

  // 2. Sync wishlist pro cloud quando muda
  useEffect(() => {
    if (!isLoggedIn || !user || !hasLoadedFromCloud.current) return;

    const syncToCloud = async () => {
      if (wishlist.length > 0) {
        const wishlistData = wishlist.map((gameId: string) => ({
          userId: user.id,
          gameId,
        }));

        await supabase?.from('wishlists').upsert(wishlistData, { onConflict: 'userId,gameId' });
      }
    };

    // Debounce sync
    const timer = setTimeout(syncToCloud, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, wishlist]);

  // 3. Sync alerts pro cloud
  useEffect(() => {
    if (!isLoggedIn || !user || alerts.length === 0) return;

    const syncAlerts = async () => {
      const alertsData = alerts.map((alert: any) => ({
        userId: user.id,
        gameId: alert.gameId,
        targetPrice: alert.targetPrice,
        storeId: alert.storeId || null,
        isActive: 1,
      }));

      await supabase?.from('price_alerts').upsert(alertsData, { onConflict: 'userId,gameId' });
    };

    const timer = setTimeout(syncAlerts, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, alerts]);

  return null;
}
