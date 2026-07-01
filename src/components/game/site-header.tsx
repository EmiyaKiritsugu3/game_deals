'use client';

import {
  BarChart3,
  ChevronDown,
  Gamepad2,
  Gift,
  Heart,
  HelpCircle,
  Layers,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useWishlist } from '@/store/wishlist';
import { AuthTrigger } from './auth-trigger';
import { ThemeToggle } from './theme-toggle';

interface SiteHeaderProps {
  onSearch: (q: string) => void;
  searchValue: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

// Primary nav links — always visible on desktop (5 links max for breathing room)
const PRIMARY_NAV = [
  { label: 'Deals', href: '#deals', icon: Sparkles },
  { label: 'Free', href: '#free', icon: Gift },
  { label: 'New', href: '#newly-added', icon: Sparkles },
  { label: 'Trending', href: '#trending', icon: TrendingUp },
  { label: 'Collections', href: '#collections', icon: Layers },
];

// Secondary nav links — grouped under "More" dropdown to reduce crowding
const SECONDARY_NAV = [
  { label: 'Deal of the Day', href: '#deal-of-day', icon: Sparkles },
  { label: 'Stores', href: '#stores', icon: Gamepad2 },
  { label: 'Deal Stats', href: '#stats', icon: BarChart3 },
  { label: 'Why Trust Us', href: '#trust', icon: ShieldCheck },
  { label: 'FAQ', href: '#faq', icon: HelpCircle },
  { label: 'How it works', href: '#how', icon: Gamepad2 },
];

export function SiteHeader({ onSearch, searchValue, searchInputRef }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const wishlistCount = useWishlist((s) => s.items.length);
  const openWishlist = useWishlist((s) => s.open);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'glass-nav shadow-[0_8px_30px_-12px_oklch(0_0_0/0.5)]' : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="#top"
          className="group flex items-center gap-2.5 shrink-0"
          aria-label="DEALFORGE home"
        >
          <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Gamepad2 className="size-5 text-primary-foreground" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight">
              DEAL<span className="text-gradient-emerald">FORGE</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Game Deals
            </span>
          </span>
        </Link>

        {/* Desktop nav — primary links + "More" dropdown for secondary */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          {PRIMARY_NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group whitespace-nowrap"
            >
              {l.label}
              <span className="absolute inset-x-2.5 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-primary to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="group relative inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded"
              aria-label="More navigation options"
            >
              More
              <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              <span className="absolute inset-x-2.5 -bottom-0.5 h-px scale-x-0 bg-gradient-to-r from-primary to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="glass-strong w-52 border-border/60 p-1.5"
              sideOffset={8}
            >
              {SECONDARY_NAV.map((l) => (
                <DropdownMenuItem key={l.href}>
                  <a
                    href={l.href}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors focus:bg-accent/30 focus:text-foreground"
                  >
                    <l.icon className="size-4 text-primary" />
                    {l.label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Search */}
        <div className="relative ml-auto hidden sm:block w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search 60,000+ games…"
            className="h-9 rounded-full border-border/60 bg-card/40 pl-9 pr-9 text-sm backdrop-blur-md placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:ml-0 ml-auto">
          <ThemeToggle />

          {/* Command palette trigger (Cmd+K) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('dealforge:open-command-palette'))}
            className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Open command palette"
            title="Search deals (Cmd+K)"
          >
            <Search className="size-3.5" />
            <kbd className="rounded border border-border/60 bg-card/60 px-1 py-0.5 font-mono text-[9px] font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openWishlist}
            className="relative size-9 rounded-full border border-border/60 bg-card/40 backdrop-blur-md hover:bg-accent/40 hover:border-primary/40 transition-colors"
            aria-label={`Wishlist (${wishlistCount} items)`}
          >
            <Heart className="size-4" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/40 animate-scale-in">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
            <span className="absolute inset-0 rounded-full ring-1 ring-primary/0 transition-all peer-checked:ring-primary/40" />
          </Button>

          {/* Auth-aware trigger: Sign-in button (signed-out) or avatar menu (signed-in) */}
          <AuthTrigger />

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9 rounded-full border border-border/60 bg-card/40 backdrop-blur-md"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border/60 animate-fade-in-down">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search games…"
                className="h-10 rounded-xl border-border/60 bg-card/50 pl-9"
              />
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 text-sm font-medium hover:bg-accent/40 transition-colors"
                >
                  <l.icon className="size-4 text-primary" />
                  {l.label}
                </a>
              ))}
            </nav>
            {/* Mobile-only auth trigger (full-width) */}
            <div className="md:hidden">
              <AuthTriggerMobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** Mobile variant of AuthTrigger — always visible, full-width, closes the mobile sheet on click. */
function AuthTriggerMobile({ onClose }: { onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const openDialog = useAuth((s) => s.openDialog);
  const signOut = useAuth((s) => s.signOut);
  const openWishlist = useWishlist((s) => s.open);
  const wishlistCount = useWishlist((s) => s.items.length);

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          openDialog();
          onClose();
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110"
      >
        <LogIn className="size-4" />
        Sign in
      </button>
    );
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/30 p-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-xs font-bold text-primary-foreground">
          {initials || <User className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          openWishlist();
          onClose();
        }}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-border/50 bg-card/30 px-3 text-sm font-medium hover:bg-accent/40"
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
      </button>
      <button
        type="button"
        onClick={() => {
          signOut();
          onClose();
        }}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-sm font-medium text-destructive hover:bg-destructive/20"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </div>
  );
}
