'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuth as useAuthNew } from '@/store/auth';
import { useAuth as useAuthOld } from '@/store/authStore';

/**
 * Syncs the Supabase-based auth store into the DEALFORGE magic-link auth store
 * so that users signed in via Supabase SSR also appear logged in to the new UI.
 * Both stores will be unified in a follow-up PR.
 */
function AuthSync() {
  const supabaseUser = useAuthOld((s) => s.user);
  const isLoggedIn = useAuthOld((s) => s.isLoggedIn);
  const setUser = useAuthNew((s) => s.setUser);
  const signOut = useAuthNew((s) => s.signOut);

  React.useEffect(() => {
    if (isLoggedIn && supabaseUser && !useAuthNew.getState().user) {
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.name,
        avatar: supabaseUser.avatar,
        provider: 'magic-link',
        signedInAt: Date.now(),
      });
    }
    if (!isLoggedIn && useAuthNew.getState().user) {
      signOut();
    }
  }, [isLoggedIn, supabaseUser, setUser, signOut]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
