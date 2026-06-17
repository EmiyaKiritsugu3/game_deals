'use client';
import { useEffect } from 'react';
import { getBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/store/authStore';

export function useAuthSubscription() {
  const { setUser } = useAuth();
  useEffect(() => {
    const supabase = getBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);
}
