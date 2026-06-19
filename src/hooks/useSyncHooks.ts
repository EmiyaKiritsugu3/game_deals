'use client';

import * as Sentry from '@sentry/nextjs';
import { type RefObject, useEffect } from 'react';
import { resolveGameUuidsAction } from '@/actions/deals';
import { getBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';

export function useWishlistSync(hasMounted: RefObject<boolean>) {
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
