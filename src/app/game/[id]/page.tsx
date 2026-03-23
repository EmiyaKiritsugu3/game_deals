import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage, getStoreLogo, isGreyMarketStore, getDrmType, getRegionTag, GameDeal } from '@/services/api';
import { estimatePlaytime, calculateCostPerHour } from '@/services/hltb';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import DealsBadge from '@/components/DealsBadge';
import AddToListButton from '@/components/AddToListButton';
import { cn } from '@/lib/utils';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [game, stores] = await Promise.all([
        getGame(id),
        getStores()
    ]);

    if (!game || !game.info) {
        return (
            <main className="min-h-[70vh] py-12">
                <div className="container text-center">
                    <h1 className="mb-4 text-2xl font-bold">Game not found</h1>
                    <Link href="/" className="text-sm font-bold text-primary hover:underline">← Back to Deals</Link>
                </div>
            </main>
        );
    }

    const highResThumb = getHighResImage(game.info.thumb);

    // Sort deals by price ascending (best deal first)
    const sortedDeals = [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    const cheapestEver = parseFloat(game.cheapestPriceEver.price);
    const bestCurrentPrice = parseFloat(sortedDeals[0]?.price ?? '9999');

    // If the best current price is within 5% of the all-time low, it's a "live HL"
    const isCurrentlyAtHL = bestCurrentPrice <= cheapestEver * 1.05;

    const playtime = estimatePlaytime(game.info.title);
    const costPerHour = calculateCostPerHour(bestCurrentPrice, playtime.mainStory);

    return (
        <main className="min-h-screen pb-16">
            <div className="container max-w-5xl pt-8">
                <Link href="/" className="mb-6 inline-block text-sm font-bold text-muted-foreground transition-colors hover:text-white">← Back to Deals</Link>

                <div className="mb-12 flex flex-col gap-8 lg:flex-row">
                    <div className="relative mx-auto aspect-460/215 w-full max-w-md shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-xl lg:w-[400px]">
                        <Image
                            src={highResThumb}
                            alt={game.info.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <h1 className="text-3xl font-black leading-tight text-white md:text-4xl lg:text-5xl">{game.info.title}</h1>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <PriceAlertTrigger 
                                    gameID={id} 
                                    gameTitle={game.info.title} 
                                    currentPrice={bestCurrentPrice} 
                                />
                                <HeartButton gameID={id} className="h-10! w-10! p-0!" />
                                <AddToListButton gameId={id} variant="full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 rounded-xl border border-white/5 bg-white/2 p-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best Price Now</span>
                                <span className="text-3xl font-black text-white">
                                    {bestCurrentPrice === 0
                                        ? <span className="text-primary">FREE</span>
                                        : `$${sortedDeals[0]?.price}`}
                                </span>
                            </div>

                            <div className="hidden w-px bg-white/10 sm:block" />

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Low</span>
                                <span className="flex items-center gap-2 text-3xl font-black text-accent-foreground">
                                    ${game.cheapestPriceEver.price}
                                    {isCurrentlyAtHL && (
                                        <span className="rounded bg-accent px-2 py-0.5 text-xs font-bold text-black shadow-[0_0_10px_hsl(var(--accent)/0.6)]">LIVE HL</span>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(game.cheapestPriceEver.date * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <div className="hidden w-px bg-white/10 sm:block" />

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">🎮 Value</span>
                                <span className="text-3xl font-black text-white">{costPerHour}</span>
                                <span className="text-xs text-muted-foreground">~{playtime.mainStory}h campaign</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store comparison list */}
                <div className="mb-12 flex flex-col gap-8">
                    {(() => {
                        const officialDeals = sortedDeals.filter(d => !isGreyMarketStore(d.storeID));
                        const keyshopDeals = sortedDeals.filter(d => isGreyMarketStore(d.storeID));
                        
                        const bestOfficialPrice = officialDeals.length > 0 ? parseFloat(officialDeals[0].price) : null;
                        const bestKeyshopPrice = keyshopDeals.length > 0 ? parseFloat(keyshopDeals[0].price) : null;

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
                                        {isEpicDeal && <DealsBadge type="EPIC" />}
                                        <span className="drmBadge">{getDrmType(deal.storeID).icon} {getDrmType(deal.storeID).label}</span>
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

                        return (
                            <>
                                {officialDeals.length > 0 && (
                                    <>
                                        <h2 className="mb-4 border-b border-white/10 pb-2 text-xl font-bold text-white">Official Stores</h2>
                                        <div className="flex flex-col gap-3">
                                            {officialDeals.map((deal) => renderDealRow(deal, parseFloat(deal.price) === bestOfficialPrice, cheapestEver))}
                                        </div>
                                    </>
                                )}
                                
                                {keyshopDeals.length > 0 && (
                                    <>
                                        <h2 className="mb-4 mt-4 border-b border-white/10 pb-2 text-xl font-bold text-orange-400">Keyshops</h2>
                                        <div className="flex flex-col gap-3">
                                            {keyshopDeals.map((deal) => renderDealRow(deal, parseFloat(deal.price) === bestKeyshopPrice, cheapestEver))}
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>

                <DynamicPriceHistory
                    currentPrice={sortedDeals[0]?.price || game.cheapestPriceEver.price}
                    lowestPrice={game.cheapestPriceEver.price}
                    lowestDate={game.cheapestPriceEver.date}
                    retailPrice={sortedDeals[0]?.retailPrice || game.cheapestPriceEver.price}
                    gameTitle={game.info.title}
                />

                <DynamicStoreCompare
                    data={sortedDeals.map(d => ({
                        storeName: stores[d.storeID] || `Store ${d.storeID}`,
                        price: d.price
                    }))}
                />
            </div>
        </main>
    );
}
