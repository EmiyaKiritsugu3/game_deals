'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type Deal, getHighResImage } from '@/services/api';
import styles from './FlashSales.module.css';

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
        seconds: totalSeconds % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper to generate a consistent "claimed" percentage based on dealID so it doesn't change on re-render
  const getClaimedPercentage = (id: string) => {
    const hash = Array.from(id).reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0);
    // Return a number between 60 and 98 to look highly claimed
    return 60 + (hash % 38);
  };

  if (!deals || deals.length === 0) return null;

  return (
    <section className={styles.flashSalesSection}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>⚡ Flash Deals</h2>
          <div className={styles.timer}>
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.colon}>:</span>
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.colon}>:</span>
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
        </div>
        <Link href="/search" className={styles.viewAll}>
          View All &gt;
        </Link>
      </div>

      <div className={styles.carousel}>
        {deals.slice(0, 8).map((deal) => {
          const claimed = getClaimedPercentage(deal.dealID);
          return (
            <Link href={`/game/${deal.gameID}`} key={deal.dealID} className={styles.flashCard}>
              <div className={styles.imageWrapper}>
                <Image
                  src={getHighResImage(deal.thumb)}
                  alt={deal.title}
                  fill
                  className={styles.image}
                  sizes="180px"
                />
                <div className={styles.discountBadge}>
                  -{Math.round(Number.parseFloat(deal.savings))}%
                </div>
              </div>

              <div className={styles.cardInfo}>
                <div className={styles.priceRow}>
                  <span className={styles.currency}>R$</span>
                  <span className={styles.salePrice}>{deal.salePrice}</span>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${claimed}%` }}></div>
                  <span className={styles.progressText}>{claimed}% Claimed</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
