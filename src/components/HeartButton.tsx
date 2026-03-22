'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import { useHydrated } from '@/hooks/useHydrated';
import styles from './HeartButton.module.css';

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
            className={`${styles.heartButton} ${isSaved ? styles.saved : ''} ${className}`}
            onClick={handleToggle}
            aria-label={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart 
                size={20} 
                className={styles.icon} 
                fill={isSaved ? "currentColor" : "none"} 
                color="currentColor"
            />
        </button>
    );
}
