import { Suspense } from 'react';
import GameBody from '@/components/game/GameBody';
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
  const playtime = estimatePlaytime(game.info.title);
  const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);
  const stats = {
    ...buildGameStats(game, bestCurrentPrice),
    costPerHour,
    playtimeMain: playtime.mainStory,
  };

  const viewModel = {
    gameTitle: game.info.title,
    highResThumb,
    bestCurrentPrice,
    bestRawPrice: sortedDeals[0]?.price ?? '0',
    stats,
    official,
    keyshop,
    cheapestEverDate: game.cheapestPriceEver.date,
    stores,
  };

  return (
    <SidebarModal>
      <GameBody viewModel={viewModel} id={id} showEpicBadge showRegion />
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
