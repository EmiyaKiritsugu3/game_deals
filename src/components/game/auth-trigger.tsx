'use client';

import { ChevronDown, Heart, LogIn, LogOut, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/store/auth';
import { useWishlist } from '@/store/wishlist';

/**
 * Header trigger for authentication. When signed-out, renders a "Sign in"
 * button that opens the auth dialog. When signed-in, renders a user avatar
 * dropdown with profile, wishlist, settings, and sign-out actions.
 */
export function AuthTrigger() {
  const user = useAuth((s) => s.user);
  const openDialog = useAuth((s) => s.openDialog);
  const signOut = useAuth((s) => s.signOut);
  const openWishlist = useWishlist((s) => s.open);
  const wishlistCount = useWishlist((s) => s.items.length);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' });
    } catch {
      // ignore network errors — client clears local state regardless
    }
    signOut();
  };

  if (!user) {
    return (
      <button
        type="button"
        onClick={openDialog}
        className="group hidden md:inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 hover:shadow-primary/50 hover:-translate-y-0.5 sheen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Sign in to DEALFORGE"
      >
        <LogIn className="size-3.5 transition-transform group-hover:scale-110" />
        Sign in
      </button>
    );
  }

  // Signed-in: avatar dropdown
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="group relative flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card/40 pl-1 pr-2.5 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Account menu for ${user.name}`}
        >
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-[11px] font-bold text-primary-foreground shadow-inner">
            {initials || <User className="size-3.5" />}
          </span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong w-60 border-border/60 p-1.5"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-xs font-bold text-primary-foreground">
            {initials || <User className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-border/40" />

        <DropdownMenuItem
          onClick={openWishlist}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm focus:bg-accent/30"
        >
          <span className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            Wishlist
          </span>
          {wishlistCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {wishlistCount}
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm focus:bg-accent/30"
          disabled
        >
          <Settings className="size-4 text-muted-foreground" />
          Settings
          <span className="ml-auto text-[9px] uppercase tracking-wider text-muted-foreground/60">
            soon
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/40" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive focus:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
