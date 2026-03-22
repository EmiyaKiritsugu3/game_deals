import { fallbackDeals } from '@/data/fallbackDeals';
export * from '@/types/game';
import { Deal, GameDetails, Store } from '@/types/game';
import { STORE_FAVICON_MAP, STEAM_STORES, GOG_STORES, EPIC_STORES, ORIGIN_STORES, MS_STORES } from '@/constants/stores';
import { generateGreyMarketDeals, getHighResImage, formatTimeAgo, generatePriceHistory } from '@/utils/pricing';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

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
        if (!res.ok) return fallbackDeals;
        const data = await res.json();
        return data.length > 0 ? data : fallbackDeals;
    } catch {
        return fallbackDeals;
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

        return game;
    } catch (error) {
        console.error('getGame error:', error);
        return null;
    }
}
