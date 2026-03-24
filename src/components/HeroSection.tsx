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
        <section className="relative flex min-h-[600px] items-center overflow-hidden mb-[3rem] bg-background after:pointer-events-none after:absolute after:inset-0 after:z-30 after:bg-[linear-gradient(to_top,var(--color-background)_5%,transparent_70%)]">

            {/* LAYER 0: The 3D Infinite Background Matrix */}
            <div
                className="pointer-events-none absolute -inset-[20%] z-0 flex overflow-hidden"
                style={{ transform: 'perspective(1000px) rotateX(20deg) rotateZ(-5deg)' }}
            >
                <div className="flex h-[150%] w-[150%] flex-wrap content-start gap-4 opacity-70 animate-matrix-drift">
                    {Array(15).fill(deals).flat().map((deal, i) => (
                        <div key={`matrix-${i}`} className="relative h-[130px] flex-[1_1_200px] overflow-hidden rounded bg-background shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            <Image
                                src={getHighResImage(deal.thumb)} 
                                alt="" 
                                fill
                                sizes="200px"
                                className="object-cover grayscale-[10%] contrast-110"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* LAYER 1: The Dark Vignette (Sinks the edges into darkness) */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-background)_100%)]" />

            {/* LAYER 2 & 3: The Carousel (Glow and Glass Panel) */}
            {deals.map((deal, idx) => {
                const isActive = idx === currentIndex;
                const dealSavings = Math.round(parseFloat(deal.savings));
                const dealThumb = getHighResImage(deal.thumb);

                return (
                    <div
                        key={deal.dealID}
                        className={cn(
                            "absolute inset-0 flex items-center justify-center opacity-0 invisible transition-all duration-[600ms] ease-in-out",
                            isActive && "opacity-100 visible z-20"
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* LAYER 2: The Organic Image Glow */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            <Image
                                src={dealThumb}
                                alt="glow"
                                fill
                                className="object-cover blur-[60px] brightness-[0.6] saturate-150 scale-125 pointer-events-none"
                                priority={idx === 0}
                            />
                        </div>
                        
                        {/* LAYER 3: The Glassmorphism Panel */}
                        <div className="container relative z-10 w-full px-4">
                            <motion.div 
                                className="relative flex min-h-[520px] w-full items-center rounded-2xl border border-border/40 bg-card/35 px-6 py-8 backdrop-blur-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] md:min-h-[380px] md:px-16 md:py-12"
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95, y: isActive ? 0 : 30 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className="grid w-full grid-cols-1 items-center gap-10 text-center md:grid-cols-2 md:gap-16 md:text-left">

                                    {/* Left Content Column */}
                                    <div className="flex flex-col gap-6">
                                        <span className="self-center md:self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.7rem] font-extrabold tracking-widest text-primary uppercase">
                                            FEATURED DEAL
                                        </span>

                                        <h1 className="m-0 text-[clamp(2.5rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-foreground drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                            {deal.title}
                                        </h1>

                                        <div className="mb-2 flex items-center justify-center gap-6 md:justify-start">
                                            {getStoreLogo(deal.storeID) && (
                                                <div className="flex items-center gap-2 rounded bg-card/70 px-2.5 py-1 text-sm font-bold text-muted-foreground border border-border/50">
                                                    <Image src={getStoreLogo(deal.storeID)!} alt="Store" width={16} height={16} className="rounded-sm" />
                                                    <span className="text-[0.75rem] uppercase tracking-wide">Ver Oferta</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <Monitor size={16} className="opacity-70 transition-opacity hover:opacity-100" />
                                                <Gamepad2 size={16} className="opacity-70 transition-opacity hover:opacity-100" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center gap-5 md:justify-start">
                                            {dealSavings > 0 && <span className="rounded bg-primary px-4 py-2 text-[1.25rem] font-extrabold text-primary-foreground">Save {dealSavings}%</span>}
                                            <div className="flex flex-col justify-center">
                                                {dealSavings > 0 && <span className="mb-0.5 text-base font-semibold leading-none text-muted-foreground line-through">${deal.normalPrice}</span>}
                                                <span className="text-[1.75rem] font-extrabold leading-none text-foreground">${deal.salePrice}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/game/${deal.gameID}`}
                                            className="mt-2 inline-flex w-full md:w-fit items-center justify-center rounded bg-foreground px-10 py-4 text-[1.05rem] font-bold text-background transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_10px_25px_-5px_rgba(255,255,255,0.15)]"
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            Get Deal Now
                                        </Link>
                                    </div>

                                    {/* LAYER 4: The 3D Tilting Image Card */}
                                    <div
                                        className="relative mx-auto aspect-460/215 w-full max-w-lg overflow-hidden rounded-lg border border-border/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_30px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] md:max-w-none hover:!transform-[perspective(1000px)_rotateY(0deg)_rotateX(0deg)_scale(1.02)]"
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
                <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-2">
                    {deals.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "h-1 w-8 rounded-sm bg-muted-foreground/30 transition-all duration-300 hover:bg-muted-foreground/70",
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