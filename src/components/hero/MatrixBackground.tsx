'use client';
import Image from 'next/image';
import { type Deal, getHighResImage } from '../../services/api';
import styles from '../HeroSection.module.css';

export function MatrixBackground({ deals }: { deals: Deal[] }) {
  return (
    <>
      <div className={styles.matrixBackground}>
        <div className={styles.matrixTrack}>
          {deals.length > 0 &&
            Array.from({ length: 15 }, (_, i) => {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: static 15-item bg grid
                <div key={i} className={styles.matrixImgWrapper}>
                  <Image
                    src={getHighResImage(deals[0].thumb)}
                    alt=""
                    aria-hidden={true}
                    loading="lazy"
                    width={200}
                    height={130}
                    className={styles.matrixImg}
                  />
                </div>
              );
            })}
        </div>
      </div>
      <div className={styles.matrixOverlay} />
    </>
  );
}
