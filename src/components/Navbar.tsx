'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, User, LogOut, Bell, ChevronDown } from 'lucide-react';
import WishlistIndicator from './WishlistIndicator';
import AuthModal from './AuthModal';
import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Navbar() {
    const { user, isLoggedIn, logout, setUser } = useAuth();
    const [query, setQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { data: results, isLoading } = useSWR(
        query.length >= 3 ? `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=5` : null,
        fetcher
    );

    useEffect(() => {
        // Initialize user session on mount
        supabase?.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
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
    }, [setUser]);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between gap-4">
                <Link href="/" className="flex items-center text-xl font-black tracking-tight text-white hover:opacity-90">
                    <span className="text-primary">Game</span>Deals
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    <Link href="/bundles" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">🎁 Bundles</Link>
                    <Link href="/collections" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">📚 Collections</Link>
                </div>

                <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
                    <div className="relative hidden w-full max-w-[300px] md:block" ref={dropdownRef}>
                        <form action="/search" className="relative flex w-full items-center">
                            <input
                                type="text"
                                name="q"
                                placeholder="Search for games..."
                                className="w-full rounded-full border border-white/10 bg-black/20 py-2 pl-4 pr-10 text-sm text-white placeholder-muted-foreground outline-hidden transition-colors focus:border-primary focus:bg-black/40 focus:ring-1 focus:ring-primary"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                autoComplete="off"
                                required
                            />
                            <button type="submit" className="absolute right-3 flex items-center justify-center text-muted-foreground hover:text-primary">
                                <Search size={18} />
                            </button>
                        </form>

                        {isDropdownOpen && query.length >= 3 && (
                            <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1f222e] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">Loading...</div>
                                ) : results && results.length > 0 ? (
                                    results.map((game: { gameID: string, thumb: string, external: string, cheapest: string }) => (
                                        <Link 
                                            href={`/game/${game.gameID}`} 
                                            key={game.gameID}
                                            className="flex items-center gap-3 border-b border-white/5 p-3 transition-colors last:border-0 hover:bg-white/5"
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setQuery('');
                                            }}
                                        >
                                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                                                <Image src={game.thumb} alt={game.external} fill style={{ objectFit: 'cover' }} sizes="40px" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate text-sm font-semibold text-white">{game.external}</span>
                                                <span className="text-xs font-medium text-primary">From ${game.cheapest}</span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No games found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <WishlistIndicator />

                    <div className="relative flex items-center ml-2 border-l border-white/10 pl-4">
                        {isLoggedIn ? (
                            <div className="group relative flex cursor-pointer items-center gap-2 rounded-full border border-white/5 bg-white/5 py-1 pl-1 pr-3 transition-colors hover:bg-white/10 hover:border-primary/50" ref={userMenuRef} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                <div className="relative h-8 w-8 overflow-hidden rounded-full shadow-inner">
                                    <Image src={user?.avatar || '/images/default-avatar.png'} alt={user?.name || 'User Avatar'} fill style={{ objectFit: 'cover' }} sizes="32px" />
                                </div>
                                <span className="hidden max-w-[100px] truncate text-sm font-bold text-white md:block">{user?.name}</span>
                                <ChevronDown size={14} className="text-muted-foreground transition-transform group-hover:text-white" />

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1f222e] py-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                        <Link href="/user" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 hover:text-primary">
                                            <User size={16} />
                                            <span>Profile</span>
                                        </Link>
                                        <Link href="/wishlist" className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 hover:text-primary">
                                            <Bell size={16} />
                                            <span>Price Alerts</span>
                                        </Link>
                                        <div className="my-1 h-px w-full bg-white/10" />
                                        <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300" onClick={logout}>
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all hover:scale-105 hover:bg-emerald-400 hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]" onClick={() => setIsAuthModalOpen(true)}>
                                <User size={18} />
                                <span className="hidden sm:block">Login</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </nav>
    );
}
