'use client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthSubscription } from '@/hooks/useAuthSubscription';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import styles from './Navbar.module.css';
import NotificationBell from './NotificationBell';
import { AuthSection } from './navbar/AuthSection';
import { SearchBox } from './navbar/SearchBox';
import { UserMenu } from './navbar/UserMenu';
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
  useServerUserSync(serverUser, () => setIsAuthModalOpen(false));

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.accent}>Game</span>Deals
        </Link>
        <div className={styles.navLinks}>
          <Link href="/bundles" className={styles.navLink}>
            🎁 Bundles
          </Link>
          <Link href="/collections" className={styles.navLink}>
            📚 Collections
          </Link>
        </div>
        <div className={styles.actionsContainer}>
          <SearchBox />
          {isLoggedIn && <NotificationBell />}
          <WishlistIndicator />
          <div className={styles.authSection}>
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
