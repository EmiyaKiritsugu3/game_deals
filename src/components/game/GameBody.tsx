import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import GameHero from '@/components/game/GameHero';
import GameStatsRow from '@/components/game/GameStatsRow';
import StoreComparison from '@/components/game/StoreComparison';
import type { GameDeal } from '@/types/game';

interface GameBodyViewModel {
  readonly gameTitle: string;
  readonly highResThumb: string;
  readonly bestRawPrice: string;
  readonly stats: {
    bestCurrentPrice: number;
    isFree: boolean;
    cheapestEver: number;
    isCurrentlyAtHL: boolean;
  };
  readonly official: GameDeal[];
  readonly keyshop: GameDeal[];
  readonly stores: Record<string, string>;
}

interface GameBodyProps {
  readonly viewModel: GameBodyViewModel;
  readonly id: string;
  readonly showEpicBadge?: boolean;
  readonly showRegion?: boolean;
  readonly priority?: boolean;
}

export default function GameBody({
  viewModel,
  id,
  showEpicBadge,
  showRegion,
  priority,
}: GameBodyProps) {
  const { gameTitle, highResThumb, bestRawPrice, stats, official, keyshop, stores } = viewModel;

  return (
    <>
      <GameHero
        gameId={id}
        gameTitle={gameTitle}
        thumb={highResThumb}
        bestCurrentPrice={stats.bestCurrentPrice}
        priority={priority}
      />

      <GameStatsRow
        bestCurrentPrice={stats.bestCurrentPrice}
        isFree={stats.isFree}
        bestRawPrice={bestRawPrice}
        cheapestEver={stats.cheapestEver}
        isCurrentlyAtHL={stats.isCurrentlyAtHL}
      />

      <StoreComparison
        officialDeals={official}
        keyshopDeals={keyshop}
        cheapestEver={stats.cheapestEver}
        gameTitle={gameTitle}
        stores={stores}
        showEpicBadge={showEpicBadge}
        showRegion={showRegion}
      />

      <DynamicPriceHistory
        currentPrice={bestRawPrice || stats.cheapestEver.toString()}
        lowestPrice={stats.cheapestEver.toFixed(2)}
        retailPrice={bestRawPrice}
        gameTitle={gameTitle}
        gameId={id}
      />

      <DynamicStoreCompare
        data={[...official, ...keyshop].map((d) => ({
          storeName: stores[d.storeID] || `Store ${d.storeID}`,
          price: d.price,
        }))}
      />
    </>
  );
}
