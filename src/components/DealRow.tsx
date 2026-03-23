import Image from 'next/image';
import Link from 'next/link';
import { Deal, getHighResImage, getStores, getStoreLogo, formatTimeAgo } from '@/services/api';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';
import DealsBadge from './DealsBadge';

interface DealRowProps {
    deal: Deal;
}

export default async function DealRow({ deal }: DealRowProps) {
    const highResThumb = getHighResImage(deal.thumb);
    const savings = Math.round(parseFloat(deal.savings));

    // Fetch stores map (Next.js deduplicates identical concurrent fetch calls)
    const storesMap = await getStores();
    const storeName = storesMap[deal.storeID] || `Store ${deal.storeID}`;
    const storeLogo = getStoreLogo(deal.storeID);

    // HL badge: savings > 85% is a strong proxy. Real HL needs per-game endpoint.
    const isHistoricalLow = savings > 85;

    const timeAgo = formatTimeAgo(deal.lastChange);
    const salePrice = parseFloat(deal.salePrice);
    const isFree = salePrice === 0;
    const isEpicDeal = savings >= 75 || isFree;

    return (
        <Link href={`/game/${deal.gameID}`} className="group flex flex-col items-stretch gap-4 rounded-xl border border-white/5 bg-white/5 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center">
            <div className="relative h-[120px] w-full shrink-0 overflow-hidden rounded-lg bg-card sm:h-[68px] sm:w-[150px]">
                <Image
                    src={highResThumb}
                    alt={deal.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 150px"
                />
                <div className="absolute right-2 top-2 flex flex-col gap-1 sm:hidden">
                    <PriceAlertBadge gameID={deal.gameID} />
                    <HeartButton gameID={deal.gameID} className="p-1.5!" />
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">{deal.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                        {storeLogo ? (
                            <Image
                                src={storeLogo}
                                alt={storeName}
                                title={storeName}
                                className="rounded-[2px]"
                                width={14}
                                height={14}
                            />
                        ) : (
                            <span>{storeName}</span>
                        )}
                        <span className="opacity-50">·</span>
                        <span>{timeAgo}</span>
                        {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
                            <>
                                <span className="opacity-50">·</span>
                                <DealsBadge type="RATING" value={deal.steamRatingPercent} />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden flex-col gap-2 sm:flex">
                        <HeartButton gameID={deal.gameID} className="p-1.5! hover:bg-white/20!" />
                        <PriceAlertBadge gameID={deal.gameID} />
                    </div>

                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                        {isHistoricalLow && (
                            <DealsBadge type="HL" />
                        )}

                        {isEpicDeal && (
                            <DealsBadge type="EPIC" compact />
                        )}

                        {savings > 0 && !isFree && (
                            <div className="flex h-8 items-center justify-center rounded bg-primary/20 px-2 font-bold text-primary">-{savings}%</div>
                        )}

                        <div className="flex min-w-[70px] flex-col items-end justify-center text-right">
                            {savings > 0 && !isFree && (
                                <span className="text-xs font-semibold text-muted-foreground line-through">${deal.normalPrice}</span>
                            )}
                            {isFree ? (
                                <span className="text-lg font-black text-primary">FREE</span>
                            ) : (
                                <span className="text-lg font-black leading-tight text-foreground">${deal.salePrice}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
