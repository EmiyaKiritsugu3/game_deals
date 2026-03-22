'use client';

import { useEffect } from 'react';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';
import { useAlerts } from '@/store/alertStore';
import { supabase } from '@/lib/supabase';

export default function SyncManager() {
    const { user, isLoggedIn } = useAuth();
    const { wishlist, setWishlist } = useWishlist();
    const { alerts, setAlerts } = useAlerts();

    useEffect(() => {
        if (!isLoggedIn || !user) return;

        let isMounted = true;

        const syncData = async () => {
            // --- WISHLIST SYNC ---
            const { data: remoteWishlist } = await supabase
                ?.from('wishlists')
                .select('game_id')
                .eq('user_id', user.id) || { data: [] };

            const remoteWishlistIds = remoteWishlist?.map((w: { game_id: string }) => w.game_id) || [];

            // Merge local and remote
            const mergedWishlist = Array.from(new Set([...wishlist, ...remoteWishlistIds]));

            // Only update local store if there are new items from cloud
            if (isMounted && mergedWishlist.length > wishlist.length) {
                // Assuming your store has a setter or we can dispatch them.
                // If not, we iterate. Let's assume you have setWishlist or we call toggle.
                // For safety, let's just use the store's state update mechanism.
                if (setWishlist) setWishlist(mergedWishlist);
            }

            // Push the merged list back up
            if (mergedWishlist.length > 0) {
                const wishlistDataToPush = mergedWishlist.map(game_id => ({
                    user_id: user.id,
                    game_id
                }));
                await supabase
                    ?.from('wishlists')
                    .upsert(wishlistDataToPush, { onConflict: 'user_id,game_id' });
            }


            // --- ALERTS SYNC ---
            const { data: remoteAlerts } = await supabase
                ?.from('price_alerts')
                .select('*')
                .eq('user_id', user.id) || { data: [] };

            const remoteAlertsMap = new Map();
            remoteAlerts?.forEach((a: { game_id: string; game_title: string; target_price: number; current_price: number; is_keyshop_allowed: boolean; }) => remoteAlertsMap.set(a.game_id, {
                gameID: a.game_id,
                gameTitle: a.game_title,
                targetPrice: a.target_price,
                currentPrice: a.current_price,
                isKeyshopAllowed: a.is_keyshop_allowed
            }));

            // Merge local alerts taking precedence (simple strategy)
            const mergedAlertsMap = new Map(remoteAlertsMap);
            alerts.forEach(a => mergedAlertsMap.set(a.gameID, a));

            const mergedAlerts = Array.from(mergedAlertsMap.values());

            if (isMounted && mergedAlerts.length > alerts.length) {
                if (setAlerts) setAlerts(mergedAlerts);
            }

            if (mergedAlerts.length > 0) {
                const alertsDataToPush = mergedAlerts.map(alert => ({
                    user_id: user.id,
                    game_id: alert.gameID,
                    game_title: alert.gameTitle,
                    target_price: alert.targetPrice,
                    current_price: alert.currentPrice,
                    is_keyshop_allowed: alert.isKeyshopAllowed
                }));

                await supabase
                    ?.from('price_alerts')
                    .upsert(alertsDataToPush, { onConflict: 'user_id,game_id' });
            }
        };

        syncData();

        return () => {
            isMounted = false;
        };
    // We intentionally omit `wishlist` and `alerts` from dependencies
    // to prevent infinite sync loops. It syncs once on login/mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, user]);

    return null;
}
