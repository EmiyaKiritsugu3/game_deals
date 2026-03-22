'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { useHydrated } from '@/hooks/useHydrated';

export default function WishlistIndicator() {
    const isHydrated = useHydrated();
    const { wishlist } = useWishlist();

    const count = isHydrated ? wishlist.length : 0;

    return (
        <Link
            href="/wishlist"
            className="group relative flex items-center gap-2 rounded-lg bg-card/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            title="Ver Favoritos"
        >
            <Heart 
                size={22} 
                className="transition-transform group-hover:scale-110"
                fill={count > 0 ? "#ef4444" : "none"} 
                color={count > 0 ? "#ef4444" : "currentColor"}
            />
            <span className="hidden sm:inline">Wishlist</span>
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                    {count}
                </span>
            )}
        </Link>
    );
}
