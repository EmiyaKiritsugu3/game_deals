"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Deal, getHighResImage, getStoreLogo } from '../services/api';
import { useWishlist } from '../store/wishlistStore';
import { cn } from '@/lib/utils';

interface GameCardProps {
    deal: Deal;
}

export default function GameCard({ deal }: GameCardProps) {
    const dealSavings = Math.round(parseFloat(deal.savings));
    const thumbUrl = getHighResImage(deal.thumb);

    // Zustand Global State
    const toggleWishlist = useWishlist((state) => state.toggleWishlist);
    const isInWishlist = useWishlist((state) => state.isInWishlist);

    // Hydration fix for persisted state
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const isSaved = mounted ? isInWishlist(deal.gameID) : false;

    return (
        <Link
            href={`/game/${deal.gameID}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-card/20 transition-all duration-300 hover:bg-card/40 hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {/* Thumbnail Container (Strict 16:9) */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-background">
                <Image
                    src={thumbUrl}
                    alt={deal.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:scale-110"
                />

                {/* OLED Pure Savings Badge */}
                {dealSavings > 0 && (
                    <div className="absolute top-2 right-2 rounded bg-primary px-2 py-1 text-xs font-black text-primary-foreground shadow-[0_0_15px_oklch(var(--color-primary)/0.5)]">
                        -{dealSavings}%
                    </div>
                )}

                {/* Quick Wishlist Action */}
                <button
                    className={cn(
                        "absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md transition-all duration-300 outline-none hover:scale-110",
                        isSaved
                            ? "bg-primary/20 text-primary opacity-100 shadow-[0_0_10px_var(--color-primary)] border border-primary/50"
                            : "bg-background/60 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-primary/20 hover:text-primary border border-transparent"
                    )}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(deal.gameID);
                    }}
                    aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart
                        size={16}
                        className={cn("transition-all duration-300", isSaved && "fill-currentColor drop-shadow-[0_0_8px_var(--color-primary)]")}
                    />
                </button>
            </div>

            {/* Metadata Container */}
            <div className="flex flex-1 flex-col justify-between p-4">
                <h3 className="line-clamp-2 text-[1.05rem] font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                    {deal.title}
                </h3>

                <div className="mt-4 flex items-end justify-between">
                    {/* Store Logo (Grayscale until hovered) */}
                    <div className="flex items-center">
                        {getStoreLogo(deal.storeID) ? (
                            <Image
                                src={getStoreLogo(deal.storeID)!}
                                alt="Store"
                                width={24}
                                height={24}
                                className="rounded-sm opacity-60 grayscale-[80%] transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                            />
                        ) : (
                            <div className="w-6 h-6" /> /* Placeholder to maintain height */
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col items-end justify-end">
                        {dealSavings > 0 && (
                            <span className="text-xs font-semibold text-muted-foreground line-through mb-0.5">
                                ${deal.normalPrice}
                            </span>
                        )}
                        <span className="text-lg font-black leading-none text-foreground drop-shadow-md">
                            ${deal.salePrice}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
