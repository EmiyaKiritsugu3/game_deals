import Image from 'next/image';
import { getGame, getStores, getHighResImage, getStoreLogo, isGreyMarketStore, getDrmType, getRegionTag, GameDeal } from '@/services/api';
import { estimatePlaytime, calculateCostPerHour } from '@/services/hltb';
import SidebarModal from '@/components/SidebarModal';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import { cn } from '@/lib/utils';

export default async function GameModal({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [game, stores] = await Promise.all([
        getGame(id),
        getStores()
    ]);

    if (!game || !game.info) {
        return (
            <SidebarModal>
                <div className="flex h-full items-center justify-center text-center p-8">
                    <h2 className="text-xl font-bold text-white">Game not found</h2>
                </div>
            </SidebarModal>
        );
    }

    const highResThumb = getHighResImage(game.info.thumb);
    const sortedDeals = [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const cheapestEver = parseFloat(game.cheapestPriceEver.price);
    const bestCurrentPrice = parseFloat(sortedDeals[0]?.price ?? '9999');
    const isCurrentlyAtHL = bestCurrentPrice <= cheapestEver * 1.05;

    const playtime = estimatePlaytime(game.info.title);
    const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);

        const renderDealRow = (deal: GameDeal, isBest: boolean, cheapestEver: number) => {
            const savings = Math.round(parseFloat(deal.savings));
            const price = parseFloat(deal.price);
            const logo = getStoreLogo(deal.storeID);
            const storeName = stores[deal.storeID] || `Store ${deal.storeID}`;
            const isDealAtHL = price <= cheapestEver * 1.05;
            const isFree = price === 0;
            const isEpicDeal = savings >= 75 || isFree;

            return (
                <a
                    key={deal.dealID}
                    href={`/out?url=${encodeURIComponent(
                        deal.dealID.startsWith('grey-')
                            ? `https://www.${storeName.toLowerCase().replace(/\s+/g, '')}.com/search?q=${encodeURIComponent(game.info.title)}`
                            : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
                    )}&store=${encodeURIComponent(storeName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "group flex flex-col justify-between gap-3 rounded-lg border border-white/5 bg-white/2 p-4 transition-all hover:border-white/20 hover:bg-white/5 sm:flex-row sm:items-center sm:gap-4",
                        isBest && "border-primary/50 bg-primary/5 hover:border-primary/80 hover:bg-primary/10"
                    )}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {logo ? (
                            <Image src={logo} alt={storeName} className="rounded-sm" width={18} height={18} />
                        ) : (
                            <div className="h-[18px] w-[18px] rounded-sm bg-white/10" />
                        )}
                        <span className="text-sm font-semibold text-white">{storeName}</span>
                        {isBest && <span className="rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-black text-black">BEST</span>}
                        {isEpicDeal && <span className="badge-epic">🔥 EPIC</span>}
                        <span className="badge-drm">{getDrmType(deal.storeID).icon} {getDrmType(deal.storeID).label}</span>
                        {getRegionTag(deal.storeID) && <span className="regionBadge">{getRegionTag(deal.storeID)}</span>}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        {isDealAtHL && <span className="rounded bg-accent px-1.5 py-0.5 text-[0.7rem] font-bold text-black shadow-[0_0_8px_hsl(var(--accent)/0.6)]">HL</span>}
                        {savings > 0 && !isFree && <div className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">-{savings}%</div>}
                        <div className="flex flex-col items-end leading-none">
                            {savings > 0 && !isFree && <span className="text-xs text-muted-foreground line-through">${deal.retailPrice}</span>}
                            {isFree ? <span className="text-lg font-black text-primary">FREE</span> : <span className="text-lg font-black text-white">${deal.price}</span>}
                        </div>
                    </div>
                </a>
            );
        };

        // Split deals
        const officialDeals = sortedDeals.filter(d => !isGreyMarketStore(d.storeID));
        const keyshopDeals = sortedDeals.filter(d => isGreyMarketStore(d.storeID));

        const bestOfficialPrice = officialDeals.length > 0 ? parseFloat(officialDeals[0].price) : null;
        const bestKeyshopPrice = keyshopDeals.length > 0 ? parseFloat(keyshopDeals[0].price) : null;

        return (
            <SidebarModal>
                <div className="relative flex aspect-video w-full flex-col justify-end overflow-hidden p-6 md:p-8">
                    <Image
                        src={highResThumb}
                        alt={game.info.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#141414] via-[#141414]/80 to-transparent" />
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <h1 className="text-3xl font-black leading-tight text-white drop-shadow-md sm:text-4xl">{game.info.title}</h1>
                        <div className="flex shrink-0 items-center gap-3">
                            <PriceAlertTrigger 
                                gameID={id} 
                                gameTitle={game.info.title} 
                                currentPrice={bestCurrentPrice} 
                            />
                            <HeartButton gameID={id} className="h-[42px]! w-[42px]! p-0!" />
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best Price Now</span>
                            <span className="text-3xl font-black text-white">
                                {bestCurrentPrice === 0 ? <span className="text-primary">FREE</span> : `$${sortedDeals[0]?.price}`}
                            </span>
                        </div>
                        <div className="hidden w-px bg-white/10 md:block" />
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Low</span>
                            <span className="flex items-center gap-2 text-3xl font-black text-accent-foreground">
                                ${game.cheapestPriceEver.price}
                                {isCurrentlyAtHL && <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold text-black shadow-[0_0_10px_hsl(var(--accent)/0.6)]">LIVE HL</span>}
                            </span>
                        </div>

                        <div className="hidden w-px bg-white/10 md:block" />

                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">🎮 Value</span>
                            <span className="text-3xl font-black text-white">{costPerHour}</span>
                            <span className="text-xs text-muted-foreground">~{playtime.mainStory}h campaign</span>
                        </div>
                    </div>

                    <div className="mb-12 flex flex-col gap-8">
                        {officialDeals.length > 0 && (
                            <>
                                <h2 className="mb-4 border-b border-white/10 pb-2 text-lg font-bold text-white">Official Stores</h2>
                                <div className="flex flex-col gap-3">
                                    {officialDeals.map((deal) => 
                                        renderDealRow(deal, parseFloat(deal.price) === bestOfficialPrice, cheapestEver)
                                    )}
                                </div>
                            </>
                        )}

                        {keyshopDeals.length > 0 && (
                            <>
                                <h2 className="mb-4 border-b border-white/10 pb-2 text-lg font-bold text-orange-400">Keyshops</h2>
                                <div className="flex flex-col gap-3">
                                    {keyshopDeals.map((deal) => 
                                        renderDealRow(deal, parseFloat(deal.price) === bestKeyshopPrice, cheapestEver)
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <DynamicPriceHistory
                        currentPrice={sortedDeals[0]?.price || game.cheapestPriceEver.price}
                        lowestPrice={game.cheapestPriceEver.price}
                        lowestDate={game.cheapestPriceEver.date}
                        retailPrice={sortedDeals[0]?.retailPrice}
                        gameTitle={game.info.title}
                    />

                    <DynamicStoreCompare
                        data={sortedDeals.map(d => ({
                            storeName: stores[d.storeID] || `Store ${d.storeID}`,
                            price: d.price
                        }))}
                    />
                </div>
            </SidebarModal>
        );
}
