'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useRef } from 'react';
import { resolveGameUuidsAction } from '@/actions/deals';
import { getUserWishlistAction } from '@/actions/wishlist';
import { getBrowserClient } from '@/lib/supabase-browser';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

export function useCloudToLocalSync() {
  const { user, isLoggedIn } = useAuth();
  const { wishlist, setWishlist } = useWishlist();
  const cloudSynced = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      cloudSynced.current = false;
      return;
    }
    if (cloudSynced.current) return;
    cloudSynced.current = true;

    const sync = async () => {
      try {
        const cloudIds = await getUserWishlistAction();
        const merged = [...new Set([...wishlist, ...cloudIds])];
        setWishlist(merged);
      } catch (err) {
        Sentry.captureException(err);
      }
    };
    sync();
  }, [isLoggedIn, user, wishlist, setWishlist]);
}

export function useWishlistSync(hasMounted: React.MutableRefObject<boolean>) {
  const { user, isLoggedIn } = useAuth();
  const { wishlist } = useWishlist();

  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (wishlist.length === 0) return;

    const sync = async () => {
      try {
        const uuidMap = await resolveGameUuidsAction(wishlist);
        const uuids = Object.values(uuidMap);
        if (uuids.length === 0) return;
        const supabase = getBrowserClient();
        const rows = uuids.map((uuid) => ({ userId: user.id, gameId: uuid }));
        await supabase.from('wishlists').upsert(rows, { onConflict: 'userId,gameId' });
      } catch (err) {
        Sentry.captureException(err);
      }
    };

    const timer = setTimeout(sync, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, wishlist, hasMounted]);
}

export function useAlertsSync(hasMounted: React.MutableRefObject<boolean>) {
  const { user, isLoggedIn } = useAuth();
  const { alerts } = useAlerts();

  useEffect(() => {
    if (!isLoggedIn || !user || !hasMounted.current) return;
    if (alerts.length === 0) return;

    const sync = async () => {
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
        Sentry.captureException(err);
      }
    };

    const timer = setTimeout(sync, 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, alerts, hasMounted.current]);
}
