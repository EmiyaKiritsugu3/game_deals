export interface Deal {
    internalName: string;
    title: string;
    metacriticLink: string;
    dealID: string;
    storeID: string;
    gameID: string;
    salePrice: string;
    normalPrice: string;
    isOnSale: string;
    savings: string;
    metacriticScore: string;
    steamRatingText: string;
    steamRatingPercent: string;
    steamRatingCount: string;
    steamAppID: string;
    releaseDate: number;
    lastChange: number;
    dealRating: string;
    thumb: string;
}

export interface Store {
    storeID: string;
    storeName: string;
    isActive: number;
}

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

// Heuristic to grab high-res Steam capsule images instead of low-res squished ones.
export function getHighResImage(url: string) {
    if (url.includes('capsule_sm_120')) {
        return url.replace('capsule_sm_120', 'header');
    }
    return url;
}

// Maps CheapShark storeID to the store's favicon URL for visual display
const STORE_FAVICON_MAP: Record<string, string> = {
    // Official Stores (from CheapShark)
    '1':  'https://www.steampowered.com/favicon.ico',      // Steam
    '2':  'https://www.gamersgate.com/favicon.ico',         // GamersGate
    '3':  'https://www.greenmangaming.com/favicon.ico',     // GreenManGaming
    '7':  'https://www.gog.com/favicon.ico',                // GOG
    '8':  'https://www.origin.com/favicon.ico',             // Origin
    '11': 'https://www.humblebundle.com/favicon.ico',       // Humble Store
    '13': 'https://www.amazon.com/favicon.ico',             // Amazon
    '15': 'https://www.fanatical.com/favicon.ico',          // Fanatical
    '21': 'https://www.wingamestore.com/favicon.ico',       // WinGameStore
    '24': 'https://www.epic.com/favicon.ico',               // Epic Games
    '25': 'https://www.gamebillet.com/favicon.ico',         // GameBillet
    '27': 'https://www.voidu.com/favicon.ico',              // Voidu
    '28': 'https://store.epicgames.com/favicon.ico',        // Epic Games Store
    '29': 'https://www.gamesplanet.com/favicon.ico',        // GamesPlanet
    '31': 'https://games.indiegala.com/favicon.ico',        // IndieGala
    '33': 'https://www.gamersgate.com/favicon.ico',         // DLGamer
    '34': 'https://microsoft.com/favicon.ico',              // Microsoft Store
    '35': 'https://www.indiegamestand.com/favicon.ico',     // IndieGameStand
    '37': 'https://www.dlgamer.com/favicon.ico',            // DLGamer
    '38': 'https://www.nuuvem.com/favicon.ico',             // Nuuvem

    // Simulated Grey Market Keyshops
    '101': 'https://www.cdkeys.com/favicon.ico',            // CDKeys
    '102': 'https://www.kinguin.net/favicon.ico',           // Kinguin
    '103': 'https://www.eneba.com/favicon.ico',             // Eneba
    '104': 'https://www.gamivo.com/favicon.ico',            // Gamivo
};

export function getStoreLogo(storeID: string): string | null {
    return STORE_FAVICON_MAP[storeID] ?? null;
}

export function isGreyMarketStore(storeID: string): boolean {
    const id = parseInt(storeID, 10);
    return id >= 100; // Anything 100+ is our custom grey market keyshop
}

/** Infer the DRM platform from the CheapShark storeID */
export function getDrmType(storeID: string): { label: string, icon: string } {
    const STEAM_STORES = ['1', '2', '3', '11', '13', '15', '21', '25', '27', '29', '31', '33', '37', '38', '101', '102', '103', '104'];
    const GOG_STORES = ['7'];
    const EPIC_STORES = ['24', '28'];
    const ORIGIN_STORES = ['8'];
    const MS_STORES = ['34'];

    if (GOG_STORES.includes(storeID)) return { label: 'DRM-Free', icon: '🔓' };
    if (EPIC_STORES.includes(storeID)) return { label: 'Epic Key', icon: '🎮' };
    if (ORIGIN_STORES.includes(storeID)) return { label: 'EA App', icon: '🅰️' };
    if (MS_STORES.includes(storeID)) return { label: 'MS Store', icon: '🪟' };
    if (STEAM_STORES.includes(storeID)) return { label: 'Steam Key', icon: '🔑' };
    return { label: 'Steam Key', icon: '🔑' }; // fallback
}

/** Check if the store delivers keys valid in Brazil */
export function getRegionTag(storeID: string): string | null {
    // Region-locked stores (hypothetical) return null
    const REGION_LOCKED: string[] = []; // None in our current dataset
    if (REGION_LOCKED.includes(storeID)) return null;
    return '🇧🇷'; // All stores currently deliver to Brazil
}

/** Format a Unix timestamp into a human-readable "X ago" string */
export function formatTimeAgo(unixTimestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - unixTimestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
}

export async function getDeals(params?: Record<string, string>): Promise<Deal[]> {
    const url = new URL(`${BASE_URL}/deals`);

    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    } else {
        // Default params for Home view
        url.searchParams.append('sortBy', 'Deal Rating');
        url.searchParams.append('onSale', '1');
        url.searchParams.append('pageSize', '20');
    }

    try {
        console.log('Fetching deals for production build...');
        const res = await fetch(url.toString(), {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('getDeals error:', error);
        // Force Vercel update to fix getDeals crash on build
        return [];
    }
}

export async function getStores(): Promise<Record<string, string>> {
    const res = await fetch(`${BASE_URL}/stores`, {
        next: { revalidate: 86400 } // Cache for 24 hours
    });

    const map: Record<string, string> = {};

    if (res.ok) {
        const stores: Store[] = await res.json();
        stores.forEach(s => map[s.storeID] = s.storeName);
    }

    // Append our synthetic keyshops
    map['101'] = 'CDKeys';
    map['102'] = 'Kinguin';
    map['103'] = 'Eneba';
    map['104'] = 'Gamivo';

    return map;
}

export interface GameInfo {
    title: string;
    steamAppID: string | null;
    thumb: string;
}

export interface LowestPrice {
    price: string;
    date: number;
}

export interface GameDeal {
    storeID: string;
    dealID: string;
    price: string;
    retailPrice: string;
    savings: string;
    dealRating: string;
}

export interface GameDetails {
    info: GameInfo;
    cheapestPriceEver: LowestPrice;
    deals: GameDeal[];
}

// Generate realistic fake keyshop deals based on the official pricing
function generateGreyMarketDeals(officialDeals: GameDeal[], dealIDRef: string): GameDeal[] {
    const keyshops = [
        { id: '101', name: 'CDKeys' },
        { id: '102', name: 'Kinguin' },
        { id: '103', name: 'Eneba' },
        { id: '104', name: 'Gamivo' }
    ];

    if (!officialDeals || officialDeals.length === 0) return [];
    
    // Base it off the current cheapest official deal
    const sortedOfficial = [...officialDeals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const bestOfficial = sortedOfficial[0];
    const retailPrice = parseFloat(bestOfficial.retailPrice);
    const bestPrice = parseFloat(bestOfficial.price);

    // If it's free or under $1, keyshops rarely sell it
    if (bestPrice < 1) return [];

    // Keyshops usually undercult official sales by 5% to 35%
    // We use a deterministic pseudo-random based on the dealID string so it doesn't jump around on reload
    const hash = Array.from(dealIDRef).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numShops = 1 + (hash % 3); // 1 to 3 keyshops
    
    const shuffledShops = [...keyshops].sort((a, b) => (hash % parseInt(a.id)) - (hash % parseInt(b.id)));
    const selectedShops = shuffledShops.slice(0, numShops);

    return selectedShops.map((shop, i) => {
        // Under cut ratio between 0.65 and 0.95
        const cutRatio = 0.65 + ((hash + i * 13) % 30) / 100;
        const keyshopPrice = (bestPrice * cutRatio).toFixed(2);
        
        return {
            storeID: shop.id,
            dealID: `grey-${shop.id}-${dealIDRef}`,
            price: keyshopPrice,
            retailPrice: bestOfficial.retailPrice,
            savings: (((retailPrice - parseFloat(keyshopPrice)) / retailPrice) * 100).toFixed(6),
            dealRating: '0.0'
        };
    });
}

export async function getGame(id: string): Promise<GameDetails> {
    const url = new URL(`${BASE_URL}/games`);
    url.searchParams.append('id', id);

    try {
        const res = await fetch(url.toString(), {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null as any;
        const game: GameDetails = await res.json();
        
        // Inject our simulated grey market deals
        if (game && game.deals && game.deals.length > 0) {
            const greyDeals = generateGreyMarketDeals(game.deals, id);
            game.deals = [...game.deals, ...greyDeals];

            // Ensure historical low is accurate with injected grey deals
            const currentLowest = [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
            if (currentLowest && game.cheapestPriceEver) {
                if (parseFloat(currentLowest.price) < parseFloat(game.cheapestPriceEver.price)) {
                    game.cheapestPriceEver.price = currentLowest.price;
                    game.cheapestPriceEver.date = Math.floor(Date.now() / 1000); // Sets HL to live date
                }
            }
        }

        return game;
    } catch (error) {
        console.error('getGame error:', error);
        return null as any;
    }
}

export function generatePriceHistory(retailPrice: number, currentPrice: number, lowestPrice: number, seed: string): { name: string, price: number }[] {
    const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];
    const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const data = months.map((month, i) => {
        if (i === 5) return { name: month, price: currentPrice };
        
        const isOnSale = (hash + i * 17) % 3 === 0;
        if (isOnSale) {
            const saleRatio = 0.3 + ((hash + i * 11) % 70) / 100;
            const simulatedSale = lowestPrice + (retailPrice - lowestPrice) * saleRatio;
            return { name: month, price: Math.round(simulatedSale * 100) / 100 };
        }
        return { name: month, price: retailPrice };
    });
    
    // Inject historic low somewhere in the curve if it's not the current price
    if (currentPrice > lowestPrice * 1.05) {
        const lowestMonthIndex = (hash % 4);
        data[lowestMonthIndex] = { name: months[lowestMonthIndex], price: lowestPrice };
    }

    return data;
}
// force sync
