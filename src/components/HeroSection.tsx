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
            className="relative flex min-h-[600px] items-center overflow-hidden bg-background mb-12 after:pointer-events-none after:absolute after:inset-0 after:z-10 after:bg-linear-to-t after:from-background after:via-transparent after:to-transparent"
            style={{ '--active-glow': activeAccentColor } as React.CSSProperties}
        >
            {/* The Infinite Background Matrix layer */}
            <div className="pointer-events-none absolute -inset-[10%] z-0 flex overflow-hidden opacity-50">
                <div className="flex h-[150%] w-[150%] flex-wrap content-start gap-4 opacity-50 animate-matrix-drift">
                    {/* Duplicate the deals array to create a dense grid covering the entire background */}
                    {Array(15).fill(deals).flat().map((deal, i) => (
                        <div key={`matrix-${i}`} className="relative h-[130px] flex-[1_1_200px] overflow-hidden rounded-lg bg-background shadow-lg">
                            <Image
                                src={getHighResImage(deal.thumb)} 
                                alt="" 
                                fill
                                sizes="100px"
                                className="object-cover opacity-60"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_30%,hsl(var(--background)/0.9)_100%)]" />

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
                        {/* The dynamic colorful glow based on the current deal's accent color */}
                        <div
                            className="absolute inset-0 z-0 opacity-40 blur-[100px] transition-colors duration-1000 ease-in-out"
                            style={{ backgroundColor: 'var(--active-glow)' }}
                        />
                        
                        {/* The Glassmorphism Panel isolated inside the slide */}
                        <div className="container relative z-30">
                            <motion.div 
                                className="flex min-h-[380px] w-full items-center rounded-2xl border border-white/5 bg-black/20 p-8 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:min-h-[400px] md:p-12 lg:p-16"
                                initial={{ opacity: 0, scale: 1, y: 0 }}
                                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1, y: isActive ? 0 : 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
                                    <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
                                        <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-primary uppercase">FEATURED DEAL</span>
                                        <h1 className="text-5xl font-black leading-[0.9] tracking-tighter text-foreground drop-shadow-lg md:text-6xl lg:text-7xl">{deal.title}</h1>

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

                                    <div className="relative mx-auto aspect-460/215 w-full max-w-lg overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] md:max-w-none">
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
