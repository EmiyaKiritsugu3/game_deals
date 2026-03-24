'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/store/wishlistStore';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    // Read wishlist array length dynamically
    const wishlistCount = useWishlist((state) => state.wishlist.length);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch for persisted store
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 30);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={cn(
            "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b border-transparent",
            isScrolled ? "bg-background/85 backdrop-blur-2xl border-white/5 shadow-2xl py-3" : "bg-gradient-to-b from-background/80 to-transparent py-6"
        )}>
            <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-6">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group outline-none">
                    <span className="text-2xl font-black tracking-tighter text-foreground transition-transform group-hover:scale-105">
                        Game<span className="text-primary drop-shadow-[0_0_8px_var(--color-primary)]">Deals</span>
                    </span>
                </Link>

                {/* Search Bar - Sleek Pill Design */}
                <div className="hidden md:flex flex-1 max-w-md relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for games, bundles..."
                        className="w-full bg-card/50 border border-white/10 rounded-full py-2.5 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card/80 focus:border-primary/50 transition-all shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                       <kbd className="hidden lg:inline-flex items-center gap-1 rounded-sm border border-white/10 bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                         <span className="text-xs">⌘</span>K
                       </kbd>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 md:gap-3">
                    {/* Mobile Search Icon */}
                    <button className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors outline-none rounded-full focus:bg-white/5">
                        <Search size={20} />
                    </button>

                    {/* Wishlist */}
                    <Link href="/wishlist" className="relative p-2 text-muted-foreground hover:text-primary transition-colors outline-none rounded-full focus:bg-white/5">
                        <Heart size={20} className="transition-transform active:scale-90" />
                        {/* Dynamic OLED Badge */}
                        {mounted && wishlistCount > 0 && (
                            <span className="absolute top-0 -right-1 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-[0_0_12px_var(--color-primary)]">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* User Profile */}
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-colors outline-none rounded-full focus:bg-white/5">
                        <User size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}