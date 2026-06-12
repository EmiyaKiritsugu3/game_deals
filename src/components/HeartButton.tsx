'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlist } from '@/store/wishlistStore';
import styles from './HeartButton.module.css';

interface HeartButtonProps {
  gameID: string;
  className?: string;
}

export default function HeartButton({ gameID, className = '' }: HeartButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSaved = mounted ? isInWishlist(gameID) : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if this is inside a Link
    e.stopPropagation();
    toggleWishlist(gameID);
  };

  return (
    <button
      className={`${styles.heartButton} ${isSaved ? styles.saved : ''} ${className}`}
      onClick={handleToggle}
      aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
      title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        size={20}
        className={styles.icon}
        fill={isSaved ? 'currentColor' : 'none'}
        color="currentColor"
      />
    </button>
  );
}
