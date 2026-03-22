'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/store/wishlistStore';
import styles from './WishlistIndicator.module.css';

export default function WishlistIndicator() {
    const [mounted, setMounted] = useState(false);
    const { wishlist } = useWishlist();

    const [count, setCount] = useState(0);

    useEffect(() => {
        setMounted(true);
        setCount(wishlist.length);
    }, [wishlist.length]);

    return (
        <Link href="/wishlist" className={styles.indicator} title="Ver Favoritos">
            <Heart 
                size={22} 
                className={styles.icon} 
                fill={count > 0 ? "#ef4444" : "none"} 
                color="currentColor"
            />
            <span className={styles.text}>Wishlist</span>
            {count > 0 && (
                <span className={styles.badge}>{count}</span>
            )}
        </Link>
    );
}
