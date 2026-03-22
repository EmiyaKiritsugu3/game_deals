'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

interface HeartButtonProps {
    gameID: string;
    className?: string;
}

export default function HeartButton({ gameID, className = '' }: HeartButtonProps) {
    const isHydrated = useHydrated();
    const { isInWishlist, toggleWishlist } = useWishlist();

    const isSaved = isHydrated ? isInWishlist(gameID) : false;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if this is inside a Link
        e.stopPropagation();
        toggleWishlist(gameID);
    };

    return (
        <button
            className={cn(
                "group relative flex items-center justify-center rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/60 hover:text-white",
                isSaved && "text-red-500 hover:text-red-600",
                className
            )}
            onClick={handleToggle}
            aria-label={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart 
                size={20} 
                className={cn("transition-transform duration-300", isSaved && "scale-110")}
                fill={isSaved ? "currentColor" : "none"} 
                color="currentColor"
            />
        </button>
    );
}
