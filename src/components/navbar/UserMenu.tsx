'use client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Bell, ChevronDown, List, LogOut, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuth } from '@/store/authStore';

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
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground no-underline rounded-lg hover:bg-muted/80 hover:text-foreground transition-all bg-transparent border-none w-full text-left cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MenuDivider() {
  return <div className="h-px bg-border my-1.5" />;
}

function UserMenuDropdown({
  isOpen,
  onLogout,
}: Readonly<{ isOpen: boolean; onLogout: () => void }>) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-[calc(100%+0.5rem)] right-0 w-[200px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.4)] p-2 z-[100]">
      <MenuItem href="/playlists" icon={<List size={16} />} label="Playlists" />
      <MenuItem href="/wishlist" icon={<Bell size={16} />} label="Price Alerts" />
      <MenuItem href="/leaderboard" icon={<Trophy size={16} />} label="Leaderboard" />
      <MenuDivider />
      <button
        type="button"
        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[hsl(0,80%,60%)] no-underline rounded-lg hover:bg-[hsl(0,80%,60%,0.08)] hover:text-[hsl(0,80%,60%)] transition-all bg-transparent border-none w-full text-left cursor-pointer"
        onClick={onLogout}
      >
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
      <Image
        src={avatar}
        alt={name}
        width={28}
        height={28}
        unoptimized
        className="w-7 h-7 rounded-full bg-muted"
      />
      <span className="text-sm font-semibold text-foreground max-lg:hidden">{name}</span>
    </>
  );
}

export function UserMenu({ user, serverUser }: UserMenuProps) {
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsUserMenuOpen(false));

  const { name } = getUserDisplay(user, serverUser);

  return (
    <div className="relative flex items-center" ref={wrapperRef}>
      <button
        className="flex items-center gap-3 cursor-pointer px-2.5 py-1.5 rounded-full bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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
        aria-label={`User menu for ${name}`}
      >
        <UserAvatar user={user} serverUser={serverUser} />
        <ChevronDown size={14} />
      </button>

      <UserMenuDropdown isOpen={isUserMenuOpen} onLogout={logout} />
    </div>
  );
}
