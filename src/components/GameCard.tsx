import Image from 'next/image';
import Link from 'next/link';
import { Deal, getStores, getHighResImage } from '../services/api';
import HeartButton from './HeartButton';
import PriceAlertBadge from './PriceAlertBadge';
import DealsBadge from './DealsBadge';
import AddToListButton from './AddToListButton';

export default async function GameCard({ deal }: { deal: Deal }) {
    const savings = Math.round(parseFloat(deal.savings));
    const stores = await getStores();
    const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
    const highResThumb = getHighResImage(deal.thumb);
    const isFree = parseFloat(deal.salePrice) === 0;
    const isEpicDeal = savings >= 75 || isFree;
    const isHistoricalLow = savings > 85;

    return (
        <Link href={`/game/${deal.gameID}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/5 bg-card transition-all hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-460/215 w-full overflow-hidden bg-black/50">
                <Image
                    src={highResThumb}
                    alt={deal.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                        {isEpicDeal && <DealsBadge type="EPIC" />}
                        {isHistoricalLow && <DealsBadge type="HL" />}
                    </div>

                    <div className="absolute bottom-3 right-3 flex items-center justify-end gap-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <PriceAlertBadge gameID={deal.gameID} />
                        <AddToListButton gameId={deal.gameID} />
                        <HeartButton gameID={deal.gameID} />
                    </div>
                </div>

                {savings > 0 && !isFree && (
                    <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-sm font-black text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
                        -{savings}%
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-4">
                <h3 className="mb-3 line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary" title={deal.title}>{deal.title}</h3>

                <div>
                    <div className="mb-2 flex items-baseline gap-2">
                        {savings > 0 && (
                            <span className="text-sm font-semibold text-muted-foreground line-through">${deal.normalPrice}</span>
                        )}
                        <span className="text-xl font-black text-foreground">
                            {isFree ? <span className="text-primary">FREE</span> : `$${deal.salePrice}`}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="rounded bg-white/5 px-2 py-1">{storeName}</span>
                        {deal.steamRatingPercent && deal.steamRatingPercent !== '0' && (
                            <span className="flex items-center gap-1 rounded bg-brand-google/10 px-2 py-1 text-brand-google">
                                ★ {deal.steamRatingPercent}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}