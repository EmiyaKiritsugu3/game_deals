'use client';

import { motion } from 'framer-motion';
import { Bell, HeartCrack, List } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import { getHighResImage } from '@/services/api';
import { useAlerts } from '@/store/alertStore';
import { useWishlist } from '@/store/wishlistStore';
import { useWishlistGames } from '@/hooks/useWishlistGames';
import styles from './page.module.css';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { alerts } = useAlerts();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'alerts'>('wishlist');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useWishlistGames(wishlist);
  const stores = data?.stores ?? {};
  const gameResults = data?.games ?? [];

  const savedGames = useMemo(() => {
    return gameResults.reduce((acc: Array<{gameID: string; title: string; thumb: string; salePrice: string; normalPrice: string; savings: number; storeID: string}>, gameData, idx) => {
      if (!gameData?.info) return acc;

      const info = gameData.info;
      const bestDeal = gameData.cheapestPriceEver;
      if (!info) return acc;
      const sortedDeals = [...gameData.deals].sort(
        (a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price)
      );
      const currentBest = sortedDeals[0];

      acc.push({
        gameID: wishlist[idx],
        title: info.title,
        thumb: getHighResImage(info.thumb),
        salePrice: currentBest ? currentBest.price : bestDeal.price,
        normalPrice: currentBest ? currentBest.retailPrice : bestDeal.price,
        savings: currentBest ? Math.round(Number.parseFloat(currentBest.savings)) : 0,
        storeID: currentBest ? currentBest.storeID : '1',
      });

      return acc;
    }, []);
  }, [gameResults, wishlist]);

  const bestDiscountGame =
    savedGames.length > 0
      ? savedGames.reduce(
          (prev, current) => (prev.savings > current.savings ? prev : current),
          savedGames[0]
        )
      : null;

  const [sortMode, setSortMode] = useState<'discount' | 'price' | 'name'>('discount');

  const displayedGames = useMemo(() => {
    const sorted = [...savedGames];
    if (sortMode === 'discount') {
      sorted.sort((a, b) => b.savings - a.savings);
    } else if (sortMode === 'price') {
      sorted.sort((a, b) => Number.parseFloat(a.salePrice) - Number.parseFloat(b.salePrice));
    } else if (sortMode === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [savedGames, sortMode]);

  const totalValue = useMemo(() => {
    return savedGames.reduce((acc, game) => acc + Number.parseFloat(game.salePrice), 0).toFixed(2);
  }, [savedGames]);

  return (
    <main className={styles.main}>
      <div className={`container ${styles.container}`}>
        <div className={styles.heroHeader}>
          {bestDiscountGame?.thumb && (
            <div
              className={styles.heroBackground}
              style={{ backgroundImage: `url(${bestDiscountGame.thumb})` }}
            />
          )}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Meu Dashboard ❤️</h1>
            <p className={styles.subtitle}>Gerencie seus jogos e alertas favoritos.</p>
          </div>
        </div>

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'wishlist' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <List size={20} />
            Wishlist ({wishlist.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'alerts' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} />
            Meus Alertas ({alerts.length})
          </button>
        </div>

        {activeTab === 'wishlist' ? (
          isLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p>Carregando seus jogos...</p>
            </div>
          ) : savedGames.length > 0 ? (
            <>
              <div className={styles.dashboardPanel}>
                <div className={styles.statsPanel}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Valor da Carteira</span>
                    <span className={styles.statValue}>${totalValue}</span>
                  </div>
                  {bestDiscountGame && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Maior Desconto</span>
                      <span className={styles.statValue}>-{bestDiscountGame.savings}%</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div className={styles.sortControls}>
                    <span className={styles.sortLabel}>Ordenar por:</span>
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as 'name' | 'price' | 'discount')}
                      className={styles.sortSelect}
                    >
                      <option value="discount">Maior Desconto</option>
                      <option value="price">Menor Preço</option>
                      <option value="name">Ordem Alfabética</option>
                    </select>
                  </div>

                  <button
                    className={styles.shareButton}
                    onClick={() => {
                      const encoded = btoa(wishlist.join(','));
                      const url = `${window.location.origin}/wishlist/shared?ids=${encoded}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                  >
                    {copied ? '✅ Link copiado!' : '🔗 Compartilhar Wishlist'}
                  </button>
                </div>
              </div>

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
                {displayedGames.map((game, idx) => (
                  <motion.div
                    key={`${game.gameID}-${idx}`}
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
                      {game.savings > 0 && (
                        <div className={styles.savingsBadge}>-{game.savings}%</div>
                      )}
                    </div>
                    <div className={styles.content}>
                      <h3 className={styles.cardTitle} title={game.title}>
                        {game.title}
                      </h3>
                      <div className={styles.priceContainer}>
                        {game.savings > 0 && (
                          <span className={styles.normalPrice}>${game.normalPrice}</span>
                        )}
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
            </>
          ) : (
            <motion.div
              className={styles.emptyState}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.5 }}
            >
              <HeartCrack size={64} className={styles.emptyIcon} />
              <h2>Sua lista está vazia :(</h2>
              <p>
                Volte para a página principal e clique no coração nos jogos que você deseja rastrear
                e acompanhar o preço!
              </p>
              <Link href="/" className={styles.browseButton}>
                Descobrir Ofertas Épicas
              </Link>
            </motion.div>
          )
        ) : /* ALERTS TAB */
        alerts.length > 0 ? (
          <div className={styles.grid}>
            {alerts.map((alert) => (
              <div key={alert.gameID} className={styles.wishlistCard}>
                <div className={styles.alertHeader}>
                  <Bell size={16} className={styles.activeBell} />
                  <span className={styles.alertStatus}>Monitoramento Ativo</span>
                </div>
                <div className={styles.content}>
                  <h3 className={styles.cardTitle}>{alert.gameTitle}</h3>
                  <div className={styles.alertPrices}>
                    <div className={styles.alertPriceBlock}>
                      <span className={styles.alertLabel}>Alvo</span>
                      <span className={styles.targetValue}>${alert.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className={styles.alertPriceBlock}>
                      <span className={styles.alertLabel}>Atual</span>
                      <span className={styles.currentValue}>${alert.currentPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={styles.alertMeta}>
                    <span className={styles.keyshopLabel}>
                      {alert.isKeyshopAllowed ? '✅ Inclui Keyshops' : '❌ Apenas Oficiais'}
                    </span>
                  </div>
                  <div className={styles.alertFooter}>
                    <PriceAlertTrigger
                      gameID={alert.gameID}
                      gameTitle={alert.gameTitle}
                      currentPrice={alert.currentPrice}
                      className={styles.editAlertBtn}
                    />
                    <Link href={`/game/${alert.gameID}`} className={styles.viewDetailsBtn}>
                      Ir para Jogo
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Bell
              size={64}
              className={styles.emptyIcon}
              style={{ color: 'hsl(var(--muted-foreground)/0.3)' }}
            />
            <h2>Nenhum alerta configurado</h2>
            <p>
              Abra a página de qualquer jogo e clique em "Alert Me" para ser notificado quando o
              preço baixar!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
