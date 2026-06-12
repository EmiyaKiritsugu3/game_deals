import type { User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';

// Supabase client é lazy-init pra evitar crash SSR
let supabaseClient: ReturnType<typeof import('@/utils/supabase/client')['createClient']> | null =
  null;
async function getSupabase() {
  if (!supabaseClient) {
    const { createClient } = await import('@/utils/supabase/client');
    supabaseClient = createClient();
  }
  return supabaseClient;
}

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

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (supabaseUser) => {
    if (supabaseUser) {
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
      set({ user: null, isLoggedIn: false });
    }
  },
  logout: async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    set({ user: null, isLoggedIn: false });
  },
}));
