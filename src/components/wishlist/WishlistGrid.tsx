'use client';

import { motion } from 'framer-motion';
import { HeartCrack } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import type { SavedGame } from '@/hooks/useSortedGames';
import styles from './WishlistGrid.module.css';

interface WishlistGridProps {
  games: SavedGame[];
  stores: Record<string, string>;
  isLoading?: boolean;
}

function LoadingState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.spinner} />
      <p>Carregando seus jogos...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className={styles.emptyState}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', bounce: 0.5 }}
    >
      <HeartCrack size={64} className={styles.emptyIcon} />
      <h2>Sua lista está vazia :(</h2>
      <p>
        Volte para a página principal e clique no coração nos jogos que você deseja rastrear e
        acompanhar o preço!
      </p>
      <Link href="/" className={styles.browseButton}>
        Descobrir Ofertas Épicas
      </Link>
    </motion.div>
  );
}

export default function WishlistGrid({ games, stores, isLoading = false }: WishlistGridProps) {
  if (isLoading) return <LoadingState />;
  if (games.length === 0) return <EmptyState />;

  return (
    <motion.div
      className={styles.grid}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {games.map((game) => (
        <motion.div
          key={game.gameID}
          className={styles.wishlistCard}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: {
              opacity: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 300, damping: 24 },
            },
          }}
        >
          <div className={styles.imageContainer}>
            <Image
              src={game.thumb}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={styles.image}
            />
            <div className={styles.cardActions}>
              <PriceAlertTrigger
                gameID={game.gameID}
                gameTitle={game.title}
                currentPrice={Number.parseFloat(game.salePrice)}
                className={styles.alertShortcut}
              />
              <HeartButton gameID={game.gameID} className={styles.heartWrapper} />
            </div>
            {game.savings > 0 && <div className={styles.savingsBadge}>-{game.savings}%</div>}
          </div>
          <div className={styles.content}>
            <h3 className={styles.cardTitle} title={game.title}>
              {game.title}
            </h3>
            <div className={styles.priceContainer}>
              {game.savings > 0 && <span className={styles.normalPrice}>${game.normalPrice}</span>}
              <span className={styles.salePrice}>${game.salePrice}</span>
            </div>
            <div className={styles.meta}>
              <span className={styles.storeBadge}>
                {stores[game.storeID] || `Store ${game.storeID}`}
              </span>
              <Link href={`/game/${game.gameID}`} className={styles.viewDetailsBtn}>
                Ver Detalhes
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
