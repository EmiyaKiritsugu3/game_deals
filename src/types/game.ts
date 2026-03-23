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
    accentColor?: string; // Appended for dynamic UI glow
}

export interface Store {
    storeID: string;
    storeName: string;
    isActive: number;
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

export interface PriceHistoryPoint {
    name: string;
    price: number;
}
