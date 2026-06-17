'use client';

import { useEffect, useRef } from 'react';
import { resolveGameUuidsAction } from '@/actions/deals';
import { getBrowserClient } from '@/lib/supabase-browser';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

export default function SyncManager() {
  const { user, isLoggedIn } = useAuth();
  const { wishlist } = useWishlist();
  const { alerts } = useAlerts();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    hasMounted.current = true;
  }, [isLoggedIn, user]);

  // fallow-ignore-next-line complexity
  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (wishlist.length === 0) return;

    const syncWishlist = async () => {
      try {
        const uuidMap = await resolveGameUuidsAction(wishlist);
        const uuids = Object.values(uuidMap);
        if (uuids.length === 0) return;
        const supabase = getBrowserClient();
        const rows = uuids.map((uuid) => ({ userId: user.id, gameId: uuid }));
        await supabase.from('wishlists').upsert(rows, { onConflict: 'userId,gameId' });
      } catch (err) {
        console.error('SyncManager: wishlist sync failed', err);
      }
    };

    const timer = setTimeout(syncWishlist, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, wishlist]);

  // fallow-ignore-next-line complexity
  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (alerts.length === 0) return;

    const syncAlerts = async () => {
      try {
        const uuidMap = await resolveGameUuidsAction(alerts.map((a) => a.gameID));
        const rows = alerts
          .map((alert) => {
            const uuid = uuidMap[alert.gameID];
            if (!uuid) return null;
            return {
              userId: user.id,
              gameId: uuid,
              targetPrice: alert.targetPrice,
              storeId: alert.storeId ?? null,
              isActive: 1,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (rows.length === 0) return;
        const supabase = getBrowserClient();
        await supabase.from('price_alerts').upsert(rows, { onConflict: 'userId,gameId' });
      } catch (err) {
        console.error('SyncManager: alerts sync failed', err);
      }
    };

    const timer = setTimeout(syncAlerts, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, alerts]);

  return null;
}
