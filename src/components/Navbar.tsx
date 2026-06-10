'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import styles from './Navbar.module.css';
import WishlistIndicator from './WishlistIndicator';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Navbar({ serverUser }: { serverUser?: any }) {
  const { user, isLoggedIn, logout, setUser } = useAuth();
  const [query, setQuery] = useQueryState('q', { defaultValue: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () =>
      fetcher(
        `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=5`
      ),
    enabled: query.length >= 3,
  });

  useEffect(() => {
    // Hydrate from SSR session safely
    if (serverUser) {
      setUser(serverUser);
      setIsAuthModalOpen(false);
    } else {
      setUser(null);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthModalOpen(false);
      }
    }) ?? { data: { subscription: { unsubscribe: () => {} } } };

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
      subscription.unsubscribe();
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

            {isDropdownOpen && query.length >= 3 && (
              <div className={styles.searchDropdown}>
                {isLoading ? (
                  <div className={`${styles.dropdownItem} ${styles.loading}`}>Loading...</div>
                ) : results && results.length > 0 ? (
                  results.map((game: any) => (
                    <Link
                      href={`/game/${game.gameID}`}
                      key={game.gameID}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setQuery('');
                      }}
                    >
                      <img src={game.thumb} alt={game.external} className={styles.dropdownThumb} />
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

          <WishlistIndicator />

          <div className={styles.authSection}>
            {user || serverUser ? (
              <div
                className={styles.userMenu}
                ref={userMenuRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <img
                  src={
                    (user || serverUser).avatar || (user || serverUser).user_metadata?.avatar_url
                  }
                  alt={(user || serverUser).name || (user || serverUser).user_metadata?.full_name}
                  className={styles.avatar}
                />
                <span className={styles.username}>
                  {(user || serverUser).name || (user || serverUser).user_metadata?.full_name}
                </span>
                <ChevronDown size={14} />

                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    <Link href="/wishlist" className={styles.menuItem}>
                      <Bell size={16} />
                      <span>Price Alerts</span>
                    </Link>
                    <div className={styles.menuDivider} />
                    <button className={`${styles.menuItem} ${styles.logout}`} onClick={logout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.loginBtn} onClick={() => setIsAuthModalOpen(true)}>
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
