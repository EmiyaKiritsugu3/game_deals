'use client';

import { useEffect } from 'react';
import { useAuth } from '@/store/authStore';
import { useWishlist } from '@/store/wishlistStore';
import { useAlerts } from '@/store/alertStore';
import { supabase } from '@/lib/supabase';

export default function SyncManager() {
    const { user, isLoggedIn } = useAuth();
    const { wishlist } = useWishlist();
    const { alerts } = useAlerts();

    useEffect(() => {
        if (!isLoggedIn || !user) return;

        const syncToCloud = async () => {
            // 1. Sync Wishlist
            if (wishlist.length > 0) {
                console.log('Syncing wishlist to cloud...');
                const wishlistData = wishlist.map((game_id: string) => ({
                    user_id: user.id,
                    game_id
                }));

                await supabase
                    ?.from('wishlists')
                    .upsert(wishlistData, { onConflict: 'user_id,game_id' });
            }

            // 2. Sync Alerts
            if (alerts.length > 0) {
                console.log('Syncing alerts to cloud...');
                const alertsData = alerts.map((alert: { gameID: string, gameTitle: string, targetPrice: number, currentPrice: number, isKeyshopAllowed: boolean }) => ({
                    user_id: user.id,
                    game_id: alert.gameID,
                    game_title: alert.gameTitle,
                    target_price: alert.targetPrice,
                    current_price: alert.currentPrice,
                    is_keyshop_allowed: alert.isKeyshopAllowed
                }));

                await supabase
                    ?.from('price_alerts')
                    .upsert(alertsData, { onConflict: 'user_id,game_id' });
            }
        };

        syncToCloud();
    }, [isLoggedIn, user, wishlist, alerts]);

    return null; // This is a logic-only component
}
