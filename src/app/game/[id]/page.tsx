import Image from 'next/image';
import Link from 'next/link';
import { getGame, getStores, getHighResImage, getStoreLogo, isGreyMarketStore, getDrmType, getRegionTag, GameDeal } from '@/services/api';
import { estimatePlaytime, calculateCostPerHour } from '@/services/hltb';
import HeartButton from '@/components/HeartButton';
import PriceAlertTrigger from '@/components/PriceAlertTrigger';
import { DynamicPriceHistory, DynamicStoreCompare } from '@/components/DynamicCharts';
import styles from './page.module.css';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [game, stores] = await Promise.all([
        getGame(id),
        getStores()
    ]);

    if (!game || !game.info) {
        return (
            <main className={styles.main}>
                <div className="container">
                    <h1>Game not found</h1>
                    <Link href="/" className={styles.backLink}>← Back to Deals</Link>
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
        <main className={styles.main}>
            <div className="container">
                <Link href="/" className={styles.backLink}>← Back to Deals</Link>

                <div className={styles.heroLayout}>
                    <div className={styles.imageWrapper}>
                        <Image
                            src={highResThumb}
                            alt={game.info.title}
                            fill
                            className={styles.image}
                            priority
                        />
                    </div>

                    <div className={styles.info}>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{game.info.title}</h1>
                            <div className={styles.actionButtons}>
                                <PriceAlertTrigger 
                                    gameID={id} 
                                    gameTitle={game.info.title} 
                                    currentPrice={bestCurrentPrice} 
                                />
                                <HeartButton gameID={id} className={styles.detailsHeart} />
                            </div>
                        </div>

                        <div className={styles.statsRow}>
                            <div className={styles.statBlock}>
                                <span className={styles.statLabel}>Best Price Now</span>
                                <span className={styles.statValue}>
                                    {bestCurrentPrice === 0
                                        ? <span className={styles.freeTag}>FREE</span>
                                        : `$${sortedDeals[0]?.price}`}
                                </span>
                            </div>

                            <div className={styles.statDivider} />

                            <div className={styles.statBlock}>
                                <span className={styles.statLabel}>Historical Low</span>
                                <span className={`${styles.statValue} ${styles.hlValue}`}>
                                    ${game.cheapestPriceEver.price}
                                    {isCurrentlyAtHL && (
                                        <span className={styles.hlActiveBadge}>LIVE HL</span>
                                    )}
                                </span>
                                <span className={styles.statSub}>
                                    {new Date(game.cheapestPriceEver.date * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <div className={styles.statDivider} />

                            <div className={styles.statBlock}>
                                <span className={styles.statLabel}>🎮 Value</span>
                                <span className={styles.statValue}>{costPerHour}</span>
                                <span className={styles.statSub}>~{playtime.mainStory}h campaign</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store comparison list */}
                <div className={styles.storeComparison}>
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
                                    className={`${styles.dealRow} ${isBest ? styles.dealRowBest : ''}`}
                                >
                                    <div className={styles.storeInfo}>
                                        {logo ? (
                                            <img src={logo} alt={storeName} className={styles.storeLogo} width={18} height={18} />
                                        ) : (
                                            <div className={styles.storeLogoPlaceholder} />
                                        )}
                                        <span className={styles.storeName}>{storeName}</span>
                                        {isBest && <span className={styles.bestTag}>BEST</span>}
                                        {isEpicDeal && <span className="epicDealBadge">🔥 EPIC</span>}
                                        <span className="drmBadge">{getDrmType(deal.storeID).icon} {getDrmType(deal.storeID).label}</span>
                                        {getRegionTag(deal.storeID) && <span className="regionBadge">{getRegionTag(deal.storeID)}</span>}
                                    </div>

                                    <div className={styles.dealPriceInfo}>
                                        {isDealAtHL && <span className={styles.hlBadge}>HL</span>}
                                        {savings > 0 && !isFree && <div className={styles.savingsBadge}>-{savings}%</div>}
                                        <div className={styles.prices}>
                                            {savings > 0 && !isFree && <span className={styles.retail}>${deal.retailPrice}</span>}
                                            {isFree ? <span className={styles.freePrice}>FREE</span> : <span className={styles.price}>${deal.price}</span>}
                                        </div>
                                    </div>
                                </a>
                            );
                        };

                        return (
                            <>
                                {officialDeals.length > 0 && (
                                    <>
                                        <h2>Official Stores</h2>
                                        <div className={styles.dealsList}>
                                            {officialDeals.map((deal) => renderDealRow(deal, parseFloat(deal.price) === bestOfficialPrice, cheapestEver))}
                                        </div>
                                    </>
                                )}
                                
                                {keyshopDeals.length > 0 && (
                                    <>
                                        <h2 className={styles.keyshopTitle}>Keyshops</h2>
                                        <div className={styles.dealsList}>
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
