'use client';

import { useEffect, useRef } from 'react';
import { resolveGameUuidsAction } from '@/actions/deals';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

let supabaseClient: ReturnType<typeof import('@/utils/supabase/client')['createClient']> | null =
  null;

async function getSupabase() {
  if (!supabaseClient) {
    const { createClient } = await import('@/utils/supabase/client');
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export default function SyncManager() {
  const { user, isLoggedIn } = useAuth();
  const { wishlist } = useWishlist();
  const { alerts } = useAlerts();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    hasMounted.current = true;
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (wishlist.length === 0) return;

    const syncWishlist = async () => {
      const uuidMap = await resolveGameUuidsAction(wishlist);
      const uuids = Object.values(uuidMap);
      if (uuids.length === 0) return;
      const supabase = await getSupabase();
      const rows = uuids.map((uuid) => ({ userId: user.id, gameId: uuid }));
      await supabase.from('wishlists').upsert(rows, { onConflict: 'userId,gameId' });
    };

    const timer = setTimeout(syncWishlist, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, wishlist]);

  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (alerts.length === 0) return;

    const syncAlerts = async () => {
      const uuidMap = await resolveGameUuidsAction(alerts.map((a) => a.gameID));
      const rows = alerts
        .map((alert) => {
          const uuid = uuidMap[alert.gameID];
          if (!uuid) return null;
          return {
            userId: user.id,
            gameId: uuid,
            targetPrice: alert.targetPrice,
            storeId: (alert as { storeId?: string }).storeId ?? null,
            isActive: 1,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (rows.length === 0) return;
      const supabase = await getSupabase();
      await supabase.from('price_alerts').upsert(rows, { onConflict: 'userId,gameId' });
    };

    const timer = setTimeout(syncAlerts, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, alerts]);

  return null;
}
