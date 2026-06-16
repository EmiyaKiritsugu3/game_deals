'use client';
import { useEffect } from 'react';
import { useAuth } from '@/store/authStore';
import { createClient } from '@/utils/supabase/client';

export function useAuthSubscription() {
  const { setUser } = useAuth();
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);
}
