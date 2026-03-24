'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Monitor, Gamepad2 } from 'lucide-react';
import { Deal, getHighResImage, getStoreLogo } from '../services/api';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
    deals: Deal[];
}

export default function HeroSection({ deals }: HeroSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play timer
    useEffect(() => {
        if (!deals || deals.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % deals.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [deals]);

    if (!deals || deals.length === 0) return null;

    return (
        <section className="relative flex min-h-[600px] w-full items-center overflow-hidden mb-12 bg-background pt-20">

            {/* LAYER 0: The 3D Infinite Background Matrix */}
            <div
                className="pointer-events-none absolute -inset-[20%] z-0 flex overflow-hidden opacity-25"
                style={{ transform: 'perspective(1000px) rotateX(20deg) rotateZ(-5deg)' }}
            >
                <div className="flex h-[150%] w-[150%] flex-wrap content-start gap-4 animate-matrix-drift">
                    {Array(15).fill(deals).flat().map((deal, i) => (
                        <div key={`matrix-${i}`} className="relative h-[130px] flex-[1_1_200px] overflow-hidden rounded bg-card shadow-lg">
                            <Image
                                src={getHighResImage(deal.thumb)} 
                                alt="" 
                                fill
                                sizes="200px"
                                className="object-cover grayscale-[30%] contrast-125 opacity-60"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* LAYER 1: The Dark Vignette (Fades to Pure Black) */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_15%,#000000_90%)]" />

            {/* CAROUSEL */}
            {deals.map((deal, idx) => {
                const isActive = idx === currentIndex;
                const dealSavings = Math.round(parseFloat(deal.savings));
                const dealThumb = getHighResImage(deal.thumb);

                return (
                    <div
                        key={deal.dealID}
                        className={cn(
                            "absolute inset-0 flex items-center justify-center opacity-0 invisible transition-all duration-[800ms] ease-in-out",
                            isActive && "opacity-100 visible z-20"
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* LAYER 2: Organic Image Glow */}
                        <div className="pointer-events-none absolute inset-0 z-0 opacity-50">
                            <Image
                                src={dealThumb}
                                alt="glow"
                                fill
                                className="object-cover blur-[80px] brightness-[0.4] saturate-[2] scale-125"
                                priority={idx === 0}
                            />
                        </div>
                        
                        {/* LAYER 3 & 4: The Glassmorphism Panel & Content */}
                        <div className="container relative z-10 w-full px-4 mx-auto max-w-7xl mt-12 md:mt-0">

                            {/* Static Glass Background (Isolated to prevent GPU blur pop) */}
                            <div className={cn(
                                "absolute inset-4 md:inset-x-0 md:inset-y-0 z-0 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl transition-opacity duration-700",
                                isActive ? "opacity-100" : "opacity-0"
                            )} />

                            <motion.div 
                                className="relative z-10 flex min-h-[480px] w-full items-center px-6 py-10 md:px-16 md:py-12"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95, y: isActive ? 0 : 20 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className="grid w-full grid-cols-1 items-center gap-12 text-center md:grid-cols-2 md:text-left">

                                    {/* Content Column */}
                                    <div className="flex flex-col gap-6">
                                        <span className="self-center md:self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.7rem] font-extrabold tracking-widest text-primary uppercase shadow-[0_0_15px_oklch(var(--color-primary)/0.2)]">
                                            Featured Deal
                                        </span>

                                        <h1 className="m-0 text-[clamp(2.5rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-foreground drop-shadow-lg">
                                            {deal.title}
                                        </h1>

                                        <div className="mb-2 flex items-center justify-center gap-6 md:justify-start">
                                            {getStoreLogo(deal.storeID) && (
                                                <div className="flex items-center gap-2 rounded bg-background/80 px-3 py-1.5 text-sm font-bold text-muted-foreground border border-white/5">
                                                    <Image src={getStoreLogo(deal.storeID)!} alt="Store" width={18} height={18} className="rounded-sm" />
                                                    <span className="text-[0.75rem] uppercase tracking-wider text-foreground">View Deal</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                <Monitor size={18} className="transition-colors hover:text-foreground" />
                                                <Gamepad2 size={18} className="transition-colors hover:text-foreground" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-5 md:justify-start mt-2">
                                            {dealSavings > 0 && <span className="rounded bg-primary px-4 py-2 text-[1.25rem] font-black text-primary-foreground shadow-[0_0_20px_oklch(var(--color-primary)/0.4)]">Save {dealSavings}%</span>}
                                            <div className="flex flex-col justify-center">
                                                {dealSavings > 0 && <span className="mb-0.5 text-sm font-semibold leading-none text-muted-foreground line-through">${deal.normalPrice}</span>}
                                                <span className="text-[2rem] font-black leading-none text-foreground">${deal.salePrice}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/game/${deal.gameID}`}
                                            className="mt-6 inline-flex w-full md:w-fit items-center justify-center rounded bg-foreground px-10 py-4 text-[1.05rem] font-bold text-background transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_10px_30px_oklch(var(--color-primary)/0.3)]"
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            Get Deal Now
                                        </Link>
                                    </div>

                                    {/* LAYER 5: The 3D Tilting Image Card */}
                                    <div
                                        className="relative mx-auto aspect-[460/215] w-full max-w-lg overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:!transform-[perspective(1000px)_rotateY(0deg)_rotateX(0deg)_scale(1.05)] md:max-w-none"
                                        style={{ transform: 'perspective(1000px) rotateY(-12deg) rotateX(6deg)' }}
                                    >
                                        <Image
                                            src={dealThumb}
                                            alt={deal.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover bg-background"
                                            priority={idx === 0}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                );
            })}

            {/* Navigation Dots */}
            {deals.length > 1 && (
                <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3">
                    {deals.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "h-1.5 w-8 rounded-full bg-white/20 transition-all duration-300 hover:bg-white/40",
                                idx === currentIndex && "w-12 bg-primary shadow-[0_0_10px_oklch(var(--color-primary)/0.5)]"
                            )}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
