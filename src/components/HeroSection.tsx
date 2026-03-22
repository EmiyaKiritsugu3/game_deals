'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Monitor, Gamepad2 } from 'lucide-react';
import { Deal, getHighResImage, getStoreLogo } from '../services/api';
import styles from './HeroSection.module.css';

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
        }, 5000); // 5 seconds per slide

        return () => clearInterval(interval);
    }, [deals]);

    if (!deals || deals.length === 0) return null;

    return (
        <section className={styles.hero}>
            {/* The Infinite Background Matrix layer */}
            <div className={styles.matrixBackground}>
                <div className={styles.matrixTrack}>
                    {/* Duplicate the deals array to create a dense grid covering the entire background */}
                    {Array(15).fill(deals).flat().map((deal, i) => (
                        <div key={`matrix-${i}`} className={styles.matrixImgWrapper}>
                            <Image
                                src={getHighResImage(deal.thumb)} 
                                alt="" 
                                fill
                                sizes="100px"
                                className={styles.matrixImg}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.matrixOverlay} />

            {/* The individual Deals carousel */}
            {deals.map((deal, idx) => {
                const isActive = idx === currentIndex;
                const dealSavings = Math.round(parseFloat(deal.savings));
                const dealThumb = getHighResImage(deal.thumb);

                return (
                    <div
                        key={deal.dealID}
                        className={`${styles.slide} ${isActive ? styles.active : ''}`}
                        aria-hidden={!isActive}
                    >
                        {/* The dynamic colorful glow based on the current deal's thumbnail */}
                        <div className={styles.backgroundBlur}>
                            <Image
                                src={dealThumb}
                                alt="background blur"
                                fill
                                className={styles.blurImg}
                            />
                        </div>
                        
                        {/* The Glassmorphism Panel isolated inside the slide */}
                        <div className="container">
                            <motion.div 
                                className={styles.glassPanel}
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95, y: isActive ? 0 : 30 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <div className={styles.heroContainer}>
                                    <div className={styles.content}>
                                        <span className={styles.featuredBadge}>FEATURED DEAL</span>
                                        <h1 className={styles.title}>{deal.title}</h1>

                                        <div className={styles.metaRow}>
                                            {getStoreLogo(deal.storeID) && (
                                                <div className={styles.storeBadge}>
                                                    <Image src={getStoreLogo(deal.storeID)!} alt="Store" width={16} height={16} />
                                                    <span className={styles.storeNameLabel}>Ver Oferta</span>
                                                </div>
                                            )}
                                            <div className={styles.platforms}>
                                                <Monitor size={16} />
                                                <Gamepad2 size={16} />
                                            </div>
                                        </div>

                                        <div className={styles.priceRow}>
                                            {dealSavings > 0 && <span className={styles.badge}>Save {dealSavings}%</span>}
                                            <div className={styles.prices}>
                                                {dealSavings > 0 && <span className={styles.normal}>${deal.normalPrice}</span>}
                                                <span className={styles.sale}>${deal.salePrice}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/game/${deal.gameID}`}
                                            className={styles.ctaButton}
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            Get Deal Now
                                        </Link>
                                    </div>

                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={dealThumb}
                                            alt={deal.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className={styles.heroImage}
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
                <div className={styles.navigation}>
                    {deals.map((_, idx) => (
                        <button
                            key={idx}
                            className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
