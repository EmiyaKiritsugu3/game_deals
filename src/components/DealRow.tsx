import Image from 'next/image';
import Link from 'next/link';
import { type Deal, formatTimeAgo, getHighResImage, getStoreLogo, getStores } from '@/services/api';
import {
  computeSavings,
  isEpicDealCheck,
  isHistoricalLowCheck,
  isPriceFree,
} from '@/utils/pricing';
import DealsBadge from './DealsBadge';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';

function DealMeta({
  deal,
  storeName,
  storeLogo,
  timeAgo,
}: Readonly<{
  deal: Deal;
  storeName: string;
  storeLogo: string | null;
  timeAgo: string;
}>) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <h3 className="text-sm font-semibold text-foreground truncate m-0 leading-tight">
        {deal.title}
      </h3>
      <div className="flex items-center gap-1 flex-wrap">
        {storeLogo ? (
          // biome-ignore lint/performance/noImgElement: store logos from affiliate CDN
          <img
            src={storeLogo}
            alt={storeName}
            title={storeName}
            className="w-3.5 h-3.5 object-contain rounded-sm opacity-85"
            width={14}
            height={14}
          />
        ) : (
          <span className="text-xs text-muted-foreground">{storeName}</span>
        )}
        <span className="text-muted-foreground/50 text-xs">·</span>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
          <>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <DealsBadge type="RATING" value={deal.steamRatingPercent} />
          </>
        )}
      </div>
    </div>
  );
}

function DealPrice({
  deal,
  savings,
  isFree,
  isHistoricalLow,
  isEpicDeal,
}: Readonly<{
  deal: Deal;
  savings: number;
  isFree: boolean;
  isHistoricalLow: boolean;
  isEpicDeal: boolean;
}>) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {isHistoricalLow && <DealsBadge type="HL" />}

      {isEpicDeal && <DealsBadge type="EPIC" compact />}

      {savings > 0 && !isFree && (
        <div className="bg-primary/15 border border-primary/40 text-primary text-xs font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
          -{savings}%
        </div>
      )}

      <div className="flex flex-col items-end min-w-[55px]">
        {savings > 0 && !isFree && (
          <span className="text-xs text-muted-foreground line-through leading-none">
            ${deal.normalPrice}
          </span>
        )}
        {isFree ? (
          <span className="text-sm font-extrabold text-primary tracking-wide leading-tight">
            FREE
          </span>
        ) : (
          <span className="text-base font-extrabold text-foreground leading-tight">
            ${deal.salePrice}
          </span>
        )}
      </div>
    </div>
  );
}

interface DealRowProps {
  readonly deal: Deal;
  readonly rank?: number;
}

export default async function DealRow({ deal, rank: _rank }: DealRowProps) {
  const highResThumb = getHighResImage(deal.thumb);
  const savings = computeSavings(deal.savings);

  // Fetch stores map (Next.js deduplicates identical concurrent fetch calls)
  const storesMap = await getStores();
  const storeName = storesMap[deal.storeID] || `Store ${deal.storeID}`;
  const storeLogo = getStoreLogo(deal.storeID);

  // HL badge: savings > 85% is a strong proxy. Real HL needs per-game endpoint.
  const isHistoricalLow = isHistoricalLowCheck(savings);

  const timeAgo = formatTimeAgo(deal.lastChange);
  const isFree = isPriceFree(deal.salePrice);
  const isEpicDeal = isEpicDealCheck(savings, isFree);

  return (
    <Link
      href={`/game/${deal.gameID}`}
      className="flex items-center bg-card border border-border/50 rounded-lg p-2 px-3 gap-3.5 no-underline min-h-[68px] cursor-pointer hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)] hover:bg-muted/40 hover:translate-x-0.5 transition-all"
    >
      <div className="relative w-[100px] h-[52px] rounded-md overflow-hidden shrink-0 bg-muted/50">
        <Image
          src={highResThumb}
          alt={deal.title}
          fill
          className="object-cover object-center"
          sizes="100px"
          unoptimized
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-5">
          <PriceAlertBadge gameID={deal.gameID} />
          <HeartButton gameID={deal.gameID} />
        </div>
      </div>

      <div className="flex items-center justify-between grow min-w-0 gap-2">
        <DealMeta deal={deal} storeName={storeName} storeLogo={storeLogo} timeAgo={timeAgo} />
        <DealPrice
          deal={deal}
          savings={savings}
          isFree={isFree}
          isHistoricalLow={isHistoricalLow}
          isEpicDeal={isEpicDeal}
        />
      </div>
    </Link>
  );
}
