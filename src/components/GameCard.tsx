import Image from 'next/image';
import Link from 'next/link';
import {
  computeSavings,
  isEpicDealCheck,
  isHistoricalLowCheck,
  isPriceFree,
} from '@/utils/pricing';
import { type Deal, getHighResImage, getStoreLogo, getStores } from '../services/api';
import AddToListButton from './AddToListButton';
import DealsBadge from './DealsBadge';
import StoreIcon from './game/StoreIcon';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';

function PriceBlock({
  savings,
  normalPrice,
  salePrice,
}: Readonly<{
  savings: number;
  normalPrice: string;
  salePrice: string;
}>) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {savings > 0 && (
        <span className="line-through text-muted-foreground text-sm">${normalPrice}</span>
      )}
      <span className="text-xl font-bold text-primary">${salePrice}</span>
    </div>
  );
}

export default async function GameCard({ deal }: Readonly<{ deal: Deal }>) {
  const stores = await getStores();
  const store = stores[deal.storeID];
  const storeLogo = getStoreLogo(deal.storeID);
  const highResThumb = getHighResImage(deal.thumb);
  const savings = computeSavings(deal.savings);
  const isFree = isPriceFree(deal.salePrice);
  const isEpicDeal = isEpicDealCheck(savings, isFree);
  const isHistoricalLow = isHistoricalLowCheck(savings);

  return (
    <div className="group flex flex-col bg-card border border-border/50 rounded-lg overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] relative h-full hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_25px_-5px_color-mix(in_srgb,var(--primary)_15%,transparent),0_0_10px_color-mix(in_srgb,var(--primary)_10%,transparent)] transition-all">
      <Link href={`/game/${deal.gameID}`} className="block">
        <div className="relative">
          <div className="relative aspect-[460/215] w-full bg-muted overflow-hidden">
            <Image
              src={highResThumb}
              alt={deal.title}
              fill
              className="object-contain bg-card transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
              <PriceAlertBadge gameID={deal.gameID} />
              <HeartButton
                gameID={deal.gameID}
                className="w-8 h-8 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-border"
              />
            </div>
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 z-[2]">
              <AddToListButton gameId={deal.gameID} />
              {isEpicDeal && <DealsBadge type="EPIC" />}
              {isHistoricalLow && <DealsBadge type="HL" />}
            </div>
            {savings > 0 && !isFree && (
              <div className="absolute top-2.5 left-2.5 bg-[#ff4d4d] text-foreground px-2 py-1 rounded text-sm font-extrabold z-10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                -{savings}%
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-1">
            <h3
              className="text-base font-semibold mb-2 text-foreground line-clamp-2 flex-grow"
              title={deal.title}
            >
              {deal.title}
            </h3>

            <PriceBlock
              savings={savings}
              normalPrice={deal.normalPrice}
              salePrice={deal.salePrice}
            />

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {store && storeLogo && <StoreIcon src={storeLogo} alt={store} />}
                {store || 'Store'}
              </span>
              {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
                <span className="text-xs text-amber-400 font-semibold">
                  ★ {deal.steamRatingPercent}%
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
