import { buildDealRowProps, buildOutUrl } from '@/lib/game-data';
import { getDrmType, getRegionTag, getStoreLogo } from '@/services/api';
import type { GameDeal } from '@/types/game';

export interface GameDealRowProps {
  readonly deal: GameDeal;
  readonly isBest: boolean;
  readonly cheapestEver: number;
  readonly gameTitle: string;
  readonly stores: Record<string, string>;
  readonly showRegion?: boolean;
  readonly showEpicBadge?: boolean;
}

function StoreLogo({ name, logo }: Readonly<{ name: string; logo: string | null }>) {
  return logo ? (
    // biome-ignore lint/performance/noImgElement: store logos from affiliate CDN
    <img
      src={logo}
      alt={name}
      className="w-[18px] h-[18px] object-contain rounded-sm opacity-90"
      width={18}
      height={18}
    />
  ) : (
    <div className="w-[18px] h-[18px] bg-muted rounded-sm" />
  );
}

function DealBadges({
  isBest,
  isEpicDeal,
  showEpicBadge,
}: Readonly<{
  isBest: boolean;
  isEpicDeal: boolean;
  showEpicBadge: boolean;
}>) {
  return (
    <>
      {isBest && (
        <span className="bg-primary text-primary-foreground text-xs font-extrabold px-1.5 py-0.5 rounded-sm tracking-wider">
          BEST
        </span>
      )}
      {showEpicBadge && isEpicDeal && <span className="epicDealBadge">🔥 EPIC</span>}
    </>
  );
}

function DealPrices({
  deal,
  savings,
  isFree,
  isDealAtHL,
}: Readonly<{
  deal: GameDeal;
  savings: number;
  isFree: boolean;
  isDealAtHL: boolean;
}>) {
  return (
    <div className="flex items-center gap-3">
      {isDealAtHL && (
        <span className="bg-[var(--accent-hl)] text-[var(--accent-hl-foreground)] text-xs font-extrabold px-1.5 py-0.5 rounded-sm tracking-wider">
          HL
        </span>
      )}
      {savings > 0 && !isFree && (
        <div className="bg-primary/15 border border-primary/40 text-primary text-xs font-bold px-1.5 py-0.5 rounded-sm">
          -{savings}%
        </div>
      )}
      <div className="flex flex-col items-end min-w-[60px]">
        {savings > 0 && !isFree && (
          <span className="text-xs text-muted-foreground line-through leading-none mb-0.5">
            ${deal.retailPrice}
          </span>
        )}
        {isFree ? (
          <span className="font-extrabold text-lg text-primary leading-none">FREE</span>
        ) : (
          <span className="font-extrabold text-lg text-foreground leading-none">${deal.price}</span>
        )}
      </div>
    </div>
  );
}

export default function GameDealRow({
  deal,
  isBest,
  cheapestEver,
  gameTitle,
  stores,
  showRegion = false,
  showEpicBadge = false,
}: GameDealRowProps) {
  const { savings, isDealAtHL, isFree, isEpicDeal } = buildDealRowProps(deal, cheapestEver);

  const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
  const logo = getStoreLogo(deal.storeID);
  const drm = getDrmType(deal.storeID);

  return (
    <a
      key={deal.dealID}
      href={buildOutUrl(deal, gameTitle, storeName)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between bg-card border border-border/50 px-5 py-3 rounded-lg transition-all no-underline hover:border-primary/40 hover:translate-x-0.5 hover:bg-muted/40 ${isBest ? 'border-primary/40 bg-primary/5' : ''}`}
      aria-label={gameTitle}
    >
      <div className="flex items-center gap-2.5">
        <StoreLogo name={storeName} logo={logo} />
        <span className="font-semibold text-sm text-foreground">{storeName}</span>
        <DealBadges isBest={isBest} isEpicDeal={isEpicDeal} showEpicBadge={showEpicBadge} />
        <span className="drmBadge">
          {drm.icon} {drm.label}
        </span>
        {showRegion && getRegionTag(deal.storeID) && (
          <span className="regionBadge">{getRegionTag(deal.storeID)}</span>
        )}
      </div>

      <DealPrices deal={deal} savings={savings} isFree={isFree} isDealAtHL={isDealAtHL} />
    </a>
  );
}
