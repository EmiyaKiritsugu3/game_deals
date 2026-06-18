import type { User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getBrowserClient } from '@/lib/supabase-browser';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (supabaseUser: SupabaseUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  setUser: (supabaseUser) => {
    if (supabaseUser) {
      // Skip update if user data hasn't changed (prevents infinite re-render loops)
      const current = get().user;
      if (current?.id === supabaseUser.id) return;
      set({
        user: {
          id: supabaseUser.id,
          name:
            supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          avatar:
            supabaseUser.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
        },
        isLoggedIn: true,
      });
    } else {
      if (!get().user) return;
      set({ user: null, isLoggedIn: false });
    }
  },
  logout: async () => {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    set({ user: null, isLoggedIn: false });
  },
}));
