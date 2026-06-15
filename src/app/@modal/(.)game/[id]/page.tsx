import { Suspense } from 'react';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import GameHero from '@/components/game/GameHero';
import GameStatsRow from '@/components/game/GameStatsRow';
import StoreComparison from '@/components/game/StoreComparison';
import SidebarModal from '@/components/SidebarModal';
import { buildGameStats, sortDealsByPrice, splitDealsByGreyMarket } from '@/lib/game-data';
import { getGame, getHighResImage, getStores, isGreyMarketStore } from '@/services/api';
import { calculateCostPerHour, estimatePlaytime } from '@/services/hltb';
import styles from './modal.module.css';

async function GameModalContent({ id }: { id: string }) {
  const [game, stores] = await Promise.all([getGame(id), getStores()]);

  if (!game?.info) {
    return (
      <SidebarModal>
        <div className={styles.errorContainer}>
          <h2>Game not found</h2>
        </div>
      </SidebarModal>
    );
  }

  const highResThumb = getHighResImage(game.info.thumb);
  const sortedDeals = sortDealsByPrice(game.deals);
  const bestCurrentPrice = Number.parseFloat(sortedDeals[0]?.price ?? '9999');
  const { official, keyshop } = splitDealsByGreyMarket(sortedDeals, isGreyMarketStore);
  const stats = buildGameStats(game, bestCurrentPrice);
  const playtime = estimatePlaytime(game.info.title);
  const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);

  return (
    <SidebarModal>
      <GameHero
        gameId={id}
        gameTitle={game.info.title}
        thumb={highResThumb}
        bestCurrentPrice={bestCurrentPrice}
        priority
        size="compact"
      />

      <div className={styles.contentBody}>
        <GameStatsRow
          bestCurrentPrice={stats.bestCurrentPrice}
          isFree={stats.isFree}
          bestRawPrice={sortedDeals[0]?.price ?? '0'}
          cheapestEver={stats.cheapestEver}
          isCurrentlyAtHL={stats.isCurrentlyAtHL}
          costPerHour={costPerHour}
          playtimeMain={playtime.mainStory}
        />

        <StoreComparison
          officialDeals={official}
          keyshopDeals={keyshop}
          cheapestEver={stats.cheapestEver}
          gameTitle={game.info.title}
          stores={stores}
          showEpicBadge
          showRegion
        />

        <DynamicPriceHistory
          currentPrice={sortedDeals[0]?.price || game.cheapestPriceEver.price}
          lowestPrice={game.cheapestPriceEver.price}
          lowestDate={game.cheapestPriceEver.date}
          retailPrice={sortedDeals[0]?.retailPrice}
          gameTitle={game.info.title}
          gameId={id}
        />

        <DynamicStoreCompare
          data={sortedDeals.map((d) => ({
            storeName: stores[d.storeID] || `Store ${d.storeID}`,
            price: d.price,
          }))}
        />
      </div>
    </SidebarModal>
  );
}

export default async function GameModal({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <SidebarModal>
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading game...</div>
        </SidebarModal>
      }
    >
      <GameModalContent id={id} />
    </Suspense>
  );
}
