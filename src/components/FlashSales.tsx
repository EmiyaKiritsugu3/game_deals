'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type Deal, getHighResImage } from '@/services/api';

interface FlashSalesProps {
  readonly deals: Deal[];
}

export default function FlashSales({ deals }: FlashSalesProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    let totalSeconds = 4 * 60 * 60 + 15 * 60 + 30;

    const interval = setInterval(() => {
      if (totalSeconds <= 0) {
        clearInterval(interval);
        return;
      }
      totalSeconds--;
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getClaimedPercentage = (id: string) => {
    let hash = 0;
    for (const char of id) {
      hash += char.codePointAt(0) ?? 0;
    }
    return 60 + (hash % 38);
  };

  if (!deals || deals.length === 0) return null;

  return (
    <section className="bg-card border border-border border-l-[3px] border-l-[var(--accent-fire)] rounded-lg px-6 py-5 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-bold text-foreground uppercase tracking-widest m-0">
            ⚡ Flash Deals
          </h2>
          <div
            className="flex items-center gap-0.5 bg-muted px-2 py-0.5 rounded-sm border border-border"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="flex flex-col items-center leading-none">
              <span className="bg-transparent text-[var(--accent-fire)] font-extrabold text-sm p-0 rounded-none tabular-nums">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[0.45rem] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                h
              </span>
            </span>
            <span className="text-muted-foreground font-extrabold animate-pulse">:</span>
            <span className="flex flex-col items-center leading-none">
              <span className="bg-transparent text-[var(--accent-fire)] font-extrabold text-sm p-0 rounded-none tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[0.45rem] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                m
              </span>
            </span>
            <span className="text-muted-foreground font-extrabold animate-pulse">:</span>
            <span className="flex flex-col items-center leading-none">
              <span className="bg-transparent text-[var(--accent-fire)] font-extrabold text-sm p-0 rounded-none tabular-nums">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[0.45rem] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                s
              </span>
            </span>
          </div>
        </div>
        <Link
          href="/search"
          className="text-xs font-bold text-primary no-underline whitespace-nowrap hover:text-foreground"
        >
          View All &gt;
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded [-webkit-mask-image:linear-gradient(to_right,black_85%,transparent_98%)] [mask-image:linear-gradient(to_right,black_85%,transparent_98%)]">
        {deals.slice(0, 8).map((deal) => {
          const claimed = getClaimedPercentage(deal.dealID);
          return (
            <Link
              href={`/game/${deal.gameID}`}
              key={deal.dealID}
              className="flex-[0_0_140px] bg-muted/40 rounded-lg overflow-hidden no-underline border border-border/60 hover:-translate-y-1 hover:border-primary/50 transition-all snap-start"
            >
              <div className="relative w-full aspect-[3/4] bg-muted/50">
                <Image
                  src={getHighResImage(deal.thumb)}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-extrabold text-xs px-1.5 py-0.5 rounded-bl-lg">
                  -{Math.round(Number.parseFloat(deal.savings))}%
                </div>
              </div>

              <div className="p-2.5 px-3 flex flex-col gap-1.5">
                <div className="flex items-baseline justify-center gap-0.5 text-primary">
                  <span className="text-xs font-bold">$</span>
                  <span className="text-lg font-extrabold">{deal.salePrice}</span>
                </div>

                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden flex items-center justify-center">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/70 rounded-full z-[1]"
                    style={{ width: `${claimed}%` }}
                  />
                  <span className="relative z-[2] text-[0.55rem] font-extrabold text-primary-foreground uppercase tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                    {claimed}% Claimed
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
