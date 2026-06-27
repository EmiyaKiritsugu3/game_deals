import { sortDealsByPrice } from '@/lib/game-data';
import type { GameDeal } from '@/types/game';
import GameDealRow from './GameDealRow';

export interface StoreComparisonProps {
  readonly officialDeals: GameDeal[];
  readonly keyshopDeals: GameDeal[];
  readonly cheapestEver: number;
  readonly gameTitle: string;
  readonly stores: Record<string, string>;
  readonly showEpicBadge?: boolean;
  readonly showRegion?: boolean;
}

export default function StoreComparison({
  officialDeals,
  keyshopDeals,
  cheapestEver,
  gameTitle,
  stores,
  showEpicBadge,
  showRegion,
}: StoreComparisonProps) {
  const sortedOfficial = sortDealsByPrice(officialDeals);
  const sortedKeyshop = sortDealsByPrice(keyshopDeals);

  const officialBest =
    sortedOfficial.length > 0 ? Number.parseFloat(sortedOfficial[0].price) : null;
  const keyshopBest = sortedKeyshop.length > 0 ? Number.parseFloat(sortedKeyshop[0].price) : null;

  return (
    <div className="mb-12">
      {sortedOfficial.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4 text-foreground">Official Stores</h2>
          <div className="flex flex-col gap-2">
            {sortedOfficial.map((deal) => (
              <GameDealRow
                key={deal.dealID}
                deal={deal}
                isBest={Number.parseFloat(deal.price) === officialBest}
                cheapestEver={cheapestEver}
                gameTitle={gameTitle}
                stores={stores}
                showEpicBadge={showEpicBadge}
                showRegion={showRegion}
              />
            ))}
          </div>
        </>
      )}

      {sortedKeyshop.length > 0 && (
        <>
          <h2 className="mt-6 pt-6 border-t border-dashed border-border relative text-xl font-bold mb-4 text-foreground">
            Keyshops
            <span className="absolute right-0 top-[1.5rem] text-xs font-extrabold tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              GREY MARKET
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {sortedKeyshop.map((deal) => (
              <GameDealRow
                key={deal.dealID}
                deal={deal}
                isBest={Number.parseFloat(deal.price) === keyshopBest}
                cheapestEver={cheapestEver}
                gameTitle={gameTitle}
                stores={stores}
                showEpicBadge={showEpicBadge}
                showRegion={showRegion}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
