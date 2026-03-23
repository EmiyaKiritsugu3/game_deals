import { fallbackDeals } from '@/data/fallbackDeals';
export * from '@/types/game';
import { Deal, GameDetails, Store } from '@/types/game';
import { STORE_FAVICON_MAP, STEAM_STORES, GOG_STORES, EPIC_STORES, ORIGIN_STORES, MS_STORES } from '@/constants/stores';
import { generateGreyMarketDeals, getHighResImage, formatTimeAgo, generatePriceHistory } from '@/utils/pricing';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

/** Helper to generate a consistent hex color from a string (e.g. gameID) */
export function getAccentColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777215)).toString(16);
    return '#' + '000000'.substring(0, 6 - color.length) + color;
}

// Re-exporting utils for backward compatibility
export { getHighResImage, formatTimeAgo, generatePriceHistory };

export function getStoreLogo(storeID: string): string | null {
    return STORE_FAVICON_MAP[storeID] ?? null;
}

export function isGreyMarketStore(storeID: string): boolean {
    return parseInt(storeID, 10) >= 100;
}

export function getDrmType(storeID: string): { label: string, icon: string } {
    if (GOG_STORES.includes(storeID)) return { label: 'DRM-Free', icon: '🔓' };
    if (EPIC_STORES.includes(storeID)) return { label: 'Epic Key', icon: '🎮' };
    if (ORIGIN_STORES.includes(storeID)) return { label: 'EA App', icon: '🅰️' };
    if (MS_STORES.includes(storeID)) return { label: 'MS Store', icon: '🪟' };
    if (STEAM_STORES.includes(storeID)) return { label: 'Steam Key', icon: '🔑' };
    return { label: 'Steam Key', icon: '🔑' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRegionTag(_storeID: string): string | null {
    return '🇧🇷';
}

export async function getDeals(params?: Record<string, string>): Promise<Deal[]> {
    // 1. Try to read from Drizzle DB cache (if we implemented a sync job)
    // For now, we check if the DB is accessible. If `DATABASE_URL` is empty, skip gracefully.
    if (typeof window === 'undefined') {
        try {
            if (process.env.DATABASE_URL && Object.keys(params || {}).length === 0) {
                const { db } = await import('@/db');
                const { deals: dealsTable } = await import('@/db/schema');
                const { eq, desc } = await import('drizzle-orm');

                const cachedDeals = await db.query.deals.findMany({
                    with: { game: true },
                    limit: 20,
                    orderBy: [desc(dealsTable.deal_rating)],
                    where: eq(dealsTable.is_grey_market, false)
                });

                if (cachedDeals.length > 0) {
                    // Map Drizzle Schema back to frontend Deal expected format
                    return cachedDeals.map((d: { game: { title: string, thumb: string | null }, deal_id: string, store_id: string, game_id: string, price: string | null, retail_price: string | null, savings: string | null, steam_rating_percent: number | null, last_change: Date | null, deal_rating: string | null }) => ({
                        internalName: d.game.title,
                        title: d.game.title,
                        metacriticLink: '',
                        dealID: d.deal_id,
                        storeID: d.store_id,
                        gameID: d.game_id,
                        salePrice: d.price || '0',
                        normalPrice: d.retail_price || '0',
                        isOnSale: d.savings ? parseFloat(d.savings) > 0 ? '1' : '0' : '0',
                        savings: d.savings || '0',
                        metacriticScore: '0',
                        steamRatingText: '',
                        steamRatingPercent: d.steam_rating_percent?.toString() || '0',
                        steamRatingCount: '0',
                        steamAppID: '0',
                        releaseDate: 0,
                        lastChange: d.last_change ? Math.floor(d.last_change.getTime() / 1000) : 0,
                        dealRating: d.deal_rating || '0',
                        thumb: d.game.thumb || '',
                        accentColor: getAccentColor(d.game_id)
                    })) as unknown as Deal[];
                }
            }
        } catch (e) {
            console.warn("DB Cache missed or failed, falling back to REST API", e);
        }
    }

    // 2. Fallback to HTTP Fetch (Current behavior)
    const url = new URL(`${BASE_URL}/deals`);
    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    } else {
        url.searchParams.append('sortBy', 'Deal Rating');
        url.searchParams.append('onSale', '1');
        url.searchParams.append('pageSize', '20');
    }

    try {
        const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
        if (!res.ok) {
            return fallbackDeals.map(d => ({ ...d, accentColor: getAccentColor(d.gameID) }));
        }
        const data = await res.json();
        return data.length > 0 ? data.map((d: Deal) => ({ ...d, accentColor: getAccentColor(d.gameID) })) : fallbackDeals.map(d => ({ ...d, accentColor: getAccentColor(d.gameID) }));
    } catch {
        return fallbackDeals.map(d => ({ ...d, accentColor: getAccentColor(d.gameID) }));
    }
}

export async function getStores(): Promise<Record<string, string>> {
    const res = await fetch(`${BASE_URL}/stores`, { next: { revalidate: 86400 } });
    const map: Record<string, string> = {};

    if (res.ok) {
        const stores: Store[] = await res.json();
        stores.forEach(s => map[s.storeID] = s.storeName);
    }

    map['101'] = 'CDKeys';
    map['102'] = 'Kinguin';
    map['103'] = 'Eneba';
    map['104'] = 'Gamivo';

    return map;
}

export async function getGame(id: string): Promise<GameDetails | null> {
    const url = new URL(`${BASE_URL}/games`);
    url.searchParams.append('id', id);

    try {
        const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const game: GameDetails = await res.json();
        
        if (game && game.deals && game.deals.length > 0) {
            const greyDeals = generateGreyMarketDeals(game.deals, id);
            game.deals = [...game.deals, ...greyDeals];

            const currentLowest = [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
            if (currentLowest && game.cheapestPriceEver) {
                if (parseFloat(currentLowest.price) < parseFloat(game.cheapestPriceEver.price)) {
                    game.cheapestPriceEver.price = currentLowest.price;
                    game.cheapestPriceEver.date = Math.floor(Date.now() / 1000);
                }
            }
        }

        // Merge Drizzle DB Metadata if available (HLTB, DRM)
        if (typeof window === 'undefined') {
            if (process.env.DATABASE_URL) {
                try {
                    const { db } = await import('@/db');
                    const { games } = await import('@/db/schema');
                    const { eq } = await import('drizzle-orm');

                    const dbGame = await db.query.games.findFirst({
                        where: eq(games.id, id)
                    });

                    if (dbGame && dbGame.hltb_main) {
                    // A real app might map this data to a custom frontend property
                    // For now, we just guarantee the query executes.
                    // game.hltbTime = dbGame.hltb_main;
                    }
                } catch {
                    // Ignore Drizzle missing schema errors locally
                }
            }
        }

        return game;
    } catch (error) {
        console.error('getGame error:', error);
        return null;
    }
}
