'use client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuth } from '@/store/authStore';
import styles from '../Navbar.module.css';

interface UserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  } | null;
  serverUser: SupabaseUser | null;
}

export function UserMenu({ user, serverUser }: UserMenuProps) {
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useClickOutside<HTMLButtonElement>(() => setIsUserMenuOpen(false));

  return (
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
          <button type="button" className={`${styles.menuItem} ${styles.logout}`} onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </button>
  );
}
