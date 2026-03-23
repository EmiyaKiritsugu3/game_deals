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
    const activeAccentColor = deals?.[currentIndex]?.accentColor || '#00d66c';

    // Auto-play timer
    useEffect(() => {
        if (!deals || deals.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % deals.length);
        }, 5000); // 5 seconds per slide

        return () => clearInterval(interval);
    }, [deals]);

    if (!deals || deals.length === 0) return null;

    return (
        <section
            className="relative min-h-[600px] flex items-center overflow-hidden mb-12 bg-background"
        >
            {/* Layer 0: 3D Matrix Background */}
            <div className="absolute -inset-[20%] z-0 overflow-hidden flex pointer-events-none transform-[perspective(1000px)_rotateX(20deg)_rotateZ(-5deg)]">
                <div className="flex flex-wrap content-start gap-4 w-[150%] h-[150%] animate-matrix-drift opacity-70">
                    {/* Duplicate the deals array to create a dense grid covering the entire background */}
                    {Array(15).fill(deals).flat().map((deal, i) => (
                        <div key={`matrix-${i}`} className="relative h-[130px] flex-[1_1_200px] overflow-hidden rounded-lg bg-background shadow-lg">
                            <Image
                                src={getHighResImage(deal.thumb)} 
                                alt="" 
                                fill
                                sizes="100px"
                                className="w-full h-full object-cover grayscale-[10%] contrast-110"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Layer 1: The Dark Vignette */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-background)_100%)]" />

            {/* The individual Deals carousel */}
            {deals.map((deal, idx) => {
                const isActive = idx === currentIndex;
                const dealSavings = Math.round(parseFloat(deal.savings));
                const dealThumb = getHighResImage(deal.thumb);

                return (
                    <div
                        key={deal.dealID}
                        className={cn(
                            "absolute inset-0 flex items-center justify-center opacity-0 invisible transition-all duration-700 ease-in-out",
                            isActive && "opacity-100 visible z-20"
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* Layer 2: Organic Image Glow */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            {isActive && (
                                <Image
                                    src={dealThumb}
                                    alt=""
                                    fill
                                    className="object-cover blur-[60px] brightness-50 saturate-150 scale-125"
                                />
                            )}
                        </div>
                        
                        {/* Layer 3: The Glass Panel */}
                        <div className="relative z-20 w-full container mx-auto">
                            <motion.div 
                                className="w-full min-h-[380px] flex items-center relative bg-card/35 backdrop-blur-2xl border border-border/40 rounded-2xl py-12 px-6 md:px-16 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)]"
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95, y: isActive ? 0 : 30 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                                    <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
                                        {/* Badges */}
                                        <span className="self-start text-[0.7rem] font-extrabold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                            FEATURED DEAL
                                        </span>
                                        {/* Layer 4: Typography & 3D Image Card */}
                                        <h1 className="text-[clamp(2.5rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-foreground drop-shadow-lg m-0">
                                            {deal.title}
                                        </h1>

                                        <div className="flex flex-wrap items-center justify-center gap-6 md:justify-start">
                                            {getStoreLogo(deal.storeID) && (
                                                <div className="flex items-center gap-2 rounded border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-bold text-muted-foreground backdrop-blur-md">
                                                    <Image src={getStoreLogo(deal.storeID)!} alt="Store" width={18} height={18} className="rounded-sm" />
                                                    <span className="uppercase tracking-wide">Ver Oferta</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <Monitor size={20} className="opacity-70 transition-opacity hover:opacity-100" />
                                                <Gamepad2 size={20} className="opacity-70 transition-opacity hover:opacity-100" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-5 md:justify-start">
                                            {dealSavings > 0 && <span className="rounded bg-primary px-4 py-2 text-xl font-black text-primary-foreground shadow-lg shadow-primary/30">Save {dealSavings}%</span>}
                                            <div className="flex flex-col justify-center">
                                                {dealSavings > 0 && <span className="text-lg font-bold leading-none text-muted-foreground line-through">${deal.normalPrice}</span>}
                                                <span className="text-3xl font-black leading-none text-foreground">${deal.salePrice}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/game/${deal.gameID}`}
                                            className="mt-2 inline-flex items-center justify-center rounded-lg bg-foreground px-10 py-4 text-lg font-bold text-background transition-all hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] w-full md:w-auto"
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            Get Deal Now
                                        </Link>
                                    </div>

                                    <div
                                        className="relative aspect-[460/215] rounded-lg overflow-hidden border border-border/60 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:!transform-[perspective(1000px)_rotateY(0deg)_rotateX(0deg)_scale(1.02)]"
                                        style={{ transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)' }}
                                    >
                                        <Image
                                            src={dealThumb}
                                            alt={deal.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover bg-card"
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
                <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2">
                    {deals.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "h-1 w-8 rounded-full bg-white/20 transition-all hover:bg-white/50",
                                idx === currentIndex && "w-12 bg-primary"
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
