'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlist } from '@/store/wishlistStore';

interface HeartButtonProps {
  readonly gameID: string;
  readonly className?: string;
}

export default function HeartButton({ gameID, className = '' }: HeartButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSaved = mounted ? isInWishlist(gameID) : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(gameID);
  };

  return (
    <button
      type="button"
      className={`bg-black/40 border border-white/10 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer text-muted-foreground transition-all duration-200 backdrop-blur-sm z-10 hover:bg-black/60 hover:text-foreground hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${isSaved ? 'text-red-500 border-red-500/30' : ''} ${className}`}
      onClick={handleToggle}
      aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
      title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        size={20}
        className={`w-5 h-5 transition-transform duration-200 ${isSaved ? 'animate-heart-burst' : ''}`}
        fill={isSaved ? 'currentColor' : 'none'}
        color="currentColor"
      />
    </button>
  );
}
