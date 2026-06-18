'use client';

import { useEffect, useRef } from 'react';
import { useAlertsSync, useCloudToLocalSync, useWishlistSync } from '@/hooks/useSyncHooks';
import { useAuth } from '@/store/authStore';

export default function SyncManager() {
  const { user, isLoggedIn } = useAuth();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    hasMounted.current = true;
  }, [isLoggedIn, user]);

  useCloudToLocalSync();
  useWishlistSync(hasMounted);
  useAlertsSync(hasMounted);

  return null;
}
