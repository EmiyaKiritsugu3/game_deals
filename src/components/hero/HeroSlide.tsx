'use client';
import { motion } from 'framer-motion';
import { Gamepad2, Monitor } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { type Deal, getHighResImage, getStoreLogo } from '../../services/api';
import styles from '../HeroSection.module.css';

export function HeroSlide({
  deal,
  isActive,
  index,
}: {
  deal: Deal;
  isActive: boolean;
  index: number;
}) {
  const dealSavings = Math.round(Number.parseFloat(deal.savings));
  const dealThumb = getHighResImage(deal.thumb);

  return (
    <div className={`${styles.slide} ${isActive ? styles.active : ''}`} aria-hidden={!isActive}>
      <div className={styles.backgroundBlur}>
        <Image src={dealThumb} alt="background blur" fill className={styles.blurImg} unoptimized />
      </div>

      <div className="container">
        <motion.div
          className={styles.glassPanel}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.95,
            y: isActive ? 0 : 30,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className={styles.heroContainer}>
            <div className={styles.content}>
              <span className={styles.featuredBadge}>FEATURED DEAL</span>
              <h1 className={styles.title}>{deal.title}</h1>

              <div className={styles.metaRow}>
                {getStoreLogo(deal.storeID) &&
                  (() => {
                    return (
                      <div className={styles.storeBadge}>
                        <Image
                          src={getStoreLogo(deal.storeID) ?? ''}
                          alt="Store"
                          width={16}
                          height={16}
                          unoptimized
                        />
                        <span className={styles.storeNameLabel}>View Deal</span>
                      </div>
                    );
                  })()}
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
                priority={index === 0}
                unoptimized
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
