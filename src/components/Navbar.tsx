'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, Search, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { searchGamesAction } from '@/actions/search';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import styles from './Navbar.module.css';
import NotificationBell from './NotificationBell';
import WishlistIndicator from './WishlistIndicator';

// fallow-ignore-next-line complexity
export default function Navbar({ serverUser }: { readonly serverUser?: SupabaseUser | null }) {
  const { user, isLoggedIn, logout, setUser } = useAuth();
  const [query, setQuery] = useQueryState('q', { defaultValue: '' });
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLButtonElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery<Array<Record<string, string>>>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchGamesAction(debouncedQuery, 5),
    enabled: debouncedQuery.length >= 3,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    // Hydrate from SSR session safely
    // Note: currently serverUser is always null (auth moved to client-side)
    if (serverUser) {
      setUser(serverUser);
      setIsAuthModalOpen(false);
    } else {
      setUser(null);
    }

    // Lazy import Supabase client + listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    import('@/utils/supabase/client')
      // fallow-ignore-next-line complexity
      .then(({ createClient }) => {
        const supabase = createClient();
        // fallow-ignore-next-line complexity
        // biome-ignore lint/suspicious/noExplicitAny: Supabase session type
        const sub = supabase.auth.onAuthStateChange((_event: string, session: any) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            setIsAuthModalOpen(false);
          }
        });
        subscription = sub.data.subscription;
      })
      .catch(() => {});

    // fallow-ignore-next-line complexity
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      subscription?.unsubscribe();
    };
  }, [setUser, serverUser]);

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
          <div className={styles.searchContainer} ref={dropdownRef}>
            <form action="/search" className={styles.searchForm}>
              <input
                type="text"
                name="q"
                placeholder="Search for games..."
                className={styles.searchInput}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                autoComplete="off"
                required
              />
              <button type="submit" className={styles.searchButton}>
                <Search size={20} />
              </button>
            </form>

            {isDropdownOpen && debouncedQuery.length >= 3 && (
              <div className={styles.searchDropdown}>
                {isLoading ? (
                  <div className={`${styles.dropdownItem} ${styles.loading}`}>Loading...</div>
                ) : results && results.length > 0 ? (
                  results.map((game) => (
                    <Link
                      href={`/game/${game.gameID}`}
                      key={game.gameID}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setQuery('');
                      }}
                    >
                      {
                        // biome-ignore lint/performance/noImgElement: search result thumbnails
                        <img
                          src={game.thumb}
                          alt={game.external}
                          className={styles.dropdownThumb}
                        />
                      }
                      <div className={styles.dropdownInfo}>
                        <span className={styles.dropdownTitle}>{game.external}</span>
                        <span className={styles.dropdownPrice}>From ${game.cheapest}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className={styles.dropdownItem}>No games found</div>
                )}
              </div>
            )}
          </div>

          {isLoggedIn && <NotificationBell />}
          <WishlistIndicator />

          <div className={styles.authSection}>
            {user || serverUser ? (
              <button
                className={styles.userMenu}
                ref={userMenuRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                type="button"
              >
                <Image
                  src={user?.avatar || serverUser?.user_metadata?.avatar_url || ''}
                  alt={user?.name || serverUser?.user_metadata?.full_name || 'User'}
                  width={28}
                  height={28}
                  unoptimized
                  className={styles.avatar}
                />
                <span className={styles.username}>
                  {user?.name || serverUser?.user_metadata?.full_name || 'User'}
                </span>
                <ChevronDown size={14} />

                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    <Link href="/wishlist" className={styles.menuItem}>
                      <Bell size={16} />
                      <span>Price Alerts</span>
                    </Link>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.logout}`}
                      onClick={logout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </button>
            ) : (
              <button
                type="button"
                className={styles.loginBtn}
                onClick={() => setIsAuthModalOpen(true)}
              >
                <User size={18} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
