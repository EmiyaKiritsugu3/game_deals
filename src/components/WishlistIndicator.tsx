'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWishlist } from '@/store/wishlistStore';

export default function WishlistIndicator() {
  const [mounted, setMounted] = useState(false);
  const { wishlist } = useWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? wishlist.length : 0;

  return (
    <Link
      href="/wishlist"
      className="flex items-center gap-2 bg-muted px-4 py-2 rounded-[var(--radius)] text-foreground no-underline font-semibold text-[0.9rem] transition-[background,transform] duration-200 border border-border/50 ml-4 hover:bg-accent hover:-translate-y-0.5 hover:border-destructive max-[600px]:px-2"
      title="View Favorites"
      aria-live="polite"
    >
      <Heart
        size={22}
        className="w-[18px] h-[18px] transition-colors duration-200 group-hover:text-destructive"
        fill={count > 0 ? '#ef4444' : 'none'}
        color="currentColor"
      />
      <span className="max-[600px]:hidden">Wishlist</span>
      {count > 0 && (
        <span className="bg-destructive text-foreground text-xs font-extrabold px-[0.15rem] py-[0.1rem] rounded-xl ml-1 animate-[pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
          {count}
        </span>
      )}
    </Link>
  );
}
