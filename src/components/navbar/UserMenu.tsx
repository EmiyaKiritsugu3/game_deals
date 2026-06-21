'use client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Bell, ChevronDown, List, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuth } from '@/store/authStore';
import styles from '../Navbar.module.css';

interface UserMenuProps {
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
  } | null;
  readonly serverUser: SupabaseUser | null;
}

function MenuItem({
  href,
  icon,
  label,
}: Readonly<{ href: string; icon: React.ReactNode; label: string }>) {
  return (
    <Link href={href} className={styles.menuItem}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MenuDivider() {
  return <div className={styles.menuDivider} />;
}

function UserMenuDropdown({
  isOpen,
  onLogout,
}: Readonly<{ isOpen: boolean; onLogout: () => void }>) {
  if (!isOpen) return null;
  return (
    <div className={styles.userDropdown}>
      <MenuItem href="/playlists" icon={<List size={16} />} label="Playlists" />
      <MenuItem href="/wishlist" icon={<Bell size={16} />} label="Price Alerts" />
      <MenuDivider />
      <button type="button" className={`${styles.menuItem} ${styles.logout}`} onClick={onLogout}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
}

function getUserDisplay(user: UserMenuProps['user'], serverUser: UserMenuProps['serverUser']) {
  return {
    avatar: user?.avatar || serverUser?.user_metadata?.avatar_url || '',
    name: user?.name || serverUser?.user_metadata?.full_name || 'User',
  };
}

function UserAvatar({ user, serverUser }: UserMenuProps) {
  const { avatar, name } = getUserDisplay(user, serverUser);
  return (
    <>
      <Image src={avatar} alt={name} width={28} height={28} unoptimized className={styles.avatar} />
      <span className={styles.username}>{name}</span>
    </>
  );
}

export function UserMenu({ user, serverUser }: UserMenuProps) {
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsUserMenuOpen(false));

  return (
    <div className={styles.userMenuWrapper} ref={wrapperRef}>
      <button
        className={styles.userMenu}
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsUserMenuOpen(!isUserMenuOpen);
          }
          if (e.key === 'Escape') setIsUserMenuOpen(false);
        }}
        type="button"
        aria-expanded={isUserMenuOpen}
        aria-haspopup="true"
      >
        <UserAvatar user={user} serverUser={serverUser} />
        <ChevronDown size={14} />
      </button>

      <UserMenuDropdown isOpen={isUserMenuOpen} onLogout={logout} />
    </div>
  );
}
