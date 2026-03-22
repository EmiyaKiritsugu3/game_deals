'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Deal, getHighResImage } from '@/services/api';

interface FlashSalesProps {
    deals: Deal[];
}

export default function FlashSales({ deals }: FlashSalesProps) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        // Create a fixed end time for today (e.g., midnight) or just a 4 hour timer from load
        let totalSeconds = 4 * 60 * 60 + 15 * 60 + 30; // 4h 15m 30s

        const interval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(interval);
                return;
            }
            totalSeconds--;
            setTimeLeft({
                hours: Math.floor(totalSeconds / 3600),
                minutes: Math.floor((totalSeconds % 3600) / 60),
                seconds: totalSeconds % 60
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Helper to generate a consistent "claimed" percentage based on dealID so it doesn't change on re-render
    const getClaimedPercentage = (id: string) => {
        const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Return a number between 60 and 98 to look highly claimed
        return 60 + (hash % 38);
    };

    if (!deals || deals.length === 0) return null;

    return (
        <section className="mb-12 rounded-xl bg-white/5 p-6 shadow-md backdrop-blur-md">
            <div className="mb-6 flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
                <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                    <h2 className="text-xl font-black uppercase tracking-tight text-[#ffaa00] md:text-2xl">⚡ Ofertas Relâmpago</h2>
                    <div className="flex items-center gap-1 rounded bg-[#ffaa00]/20 px-3 py-1 font-mono text-xl font-bold tracking-widest text-[#ffaa00] shadow-[inset_0_0_10px_rgba(255,170,0,0.2)]">
                        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="opacity-70 animate-pulse">:</span>
                        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="opacity-70 animate-pulse">:</span>
                        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                </div>
                <Link href="/search" className="text-sm font-bold text-muted-foreground transition-colors hover:text-[#ffaa00]">Ver Tudo &gt;</Link>
            </div>

            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 scrollbar-hide md:grid md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:overflow-visible md:pb-0">
                {deals.slice(0, 8).map((deal) => {
                    const claimed = getClaimedPercentage(deal.dealID);
                    return (
                        <Link href={`/game/${deal.gameID}`} key={deal.dealID} className="group relative flex w-[180px] shrink-0 snap-center flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-all hover:-translate-y-2 hover:border-[#ffaa00]/50 hover:shadow-[0_15px_30px_-5px_rgba(255,170,0,0.2)] md:w-auto">
                            <div className="relative aspect-[460/215] w-full overflow-hidden bg-black/60">
                                <Image
                                    src={getHighResImage(deal.thumb)}
                                    alt={deal.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="180px"
                                />
                                <div className="absolute right-0 top-0 flex items-center justify-center rounded-bl-lg bg-[#ffaa00] px-2 py-1 text-sm font-black text-black">-{Math.round(parseFloat(deal.savings))}%</div>
                            </div>

                            <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                                <div className="flex items-baseline gap-1 text-[#ffaa00]">
                                    <span className="text-xs font-bold">$</span>
                                    <span className="text-2xl font-black leading-none">{deal.salePrice}</span>
                                </div>

                                <div className="relative flex h-5 items-center overflow-hidden rounded-full bg-[#332200]">
                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff7700] to-[#ffcc00] transition-all duration-1000" style={{ width: `${claimed}%` }}></div>
                                    <span className="relative z-10 w-full text-center text-[10px] font-bold text-white mix-blend-difference">{claimed}% Resgatado</span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}
