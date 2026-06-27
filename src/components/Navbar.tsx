'use client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuthSubscription } from '@/hooks/useAuthSubscription';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import InstallPWAButton from './InstallPWAButton';
import NotificationBell from './NotificationBell';
import { AuthSection } from './navbar/AuthSection';
import { SearchBox } from './navbar/SearchBox';
import { UserMenu } from './navbar/UserMenu';
import ThemeToggle from './ThemeToggle';
import WishlistIndicator from './WishlistIndicator';

function useServerUserSync(
  serverUser: SupabaseUser | null | undefined,
  closeAuthModal: () => void
) {
  const { setUser } = useAuth();

  useEffect(() => {
    if (serverUser) {
      setUser(serverUser);
      closeAuthModal();
    } else {
      setUser(null);
    }
  }, [setUser, serverUser, closeAuthModal]);
}

export default function Navbar({ serverUser }: { readonly serverUser?: SupabaseUser | null }) {
  const { user, isLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useAuthSubscription();
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  useServerUserSync(serverUser, closeAuthModal);

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
      <div className="container flex items-center justify-between gap-8">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-foreground no-underline flex items-center"
        >
          <span className="text-primary mr-px">Game</span>Deals
        </Link>
        <div className="flex items-center gap-1 max-sm:hidden">
          <Link
            href="/bundles"
            className="text-sm font-semibold text-muted-foreground no-underline px-3 py-1.5 rounded-lg hover:text-primary hover:bg-muted/50 transition-all whitespace-nowrap"
          >
            🎁 Bundles
          </Link>
          <Link
            href="/collections"
            className="text-sm font-semibold text-muted-foreground no-underline px-3 py-1.5 rounded-lg hover:text-primary hover:bg-muted/50 transition-all whitespace-nowrap"
          >
            📚 Collections
          </Link>
        </div>
        <div className="flex items-center justify-end flex-1 gap-6">
          <SearchBox />
          {isLoggedIn && <NotificationBell />}
          <WishlistIndicator />
          <InstallPWAButton />
          <ThemeToggle />
          <div className="flex items-center gap-4">
            {user || serverUser ? (
              <UserMenu user={user} serverUser={serverUser ?? null} />
            ) : (
              <AuthSection onLoginClickAction={() => setIsAuthModalOpen(true)} />
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
