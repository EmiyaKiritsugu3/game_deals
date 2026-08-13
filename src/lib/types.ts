// CheapShark API types — mirrors https://apidocs.cheapshark.com

export interface CheapSharkStore {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

export interface Deal {
  internalName: string;
  title: string;
  metacriticLink: string | null;
  dealID: string;
  storeID: string;
  gameID: string;
  steamAppID: string | null;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  steamRatingText: string;
  steamRatingCount: string;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface GameDealEntry {
  dealID: string;
  storeID: string;
  price: string;
  retailPrice: string;
  savings: string;
}

// Normalised shapes the UI consumes
export interface Store extends CheapSharkStore {
  isActiveBool: boolean;
  bannerUrl: string;
  logoUrl: string;
  iconUrl: string;
}

export interface DealWithStore extends Deal {
  store?: Store;
  salePriceNum: number;
  normalPriceNum: number;
  savingsNum: number;
  dealRatingNum: number;
  metacriticScoreNum: number;
  steamRatingNum: number;
  releaseDateMs: number;
  releaseDateLabel: string;
  isFree: boolean;
}

export type SortOption =
  | 'deal-rating'
  | 'savings'
  | 'price-asc'
  | 'price-desc'
  | 'metacritic'
  | 'recent';

/** An item in the user's wishlist. */
export interface WishlistItem {
  dealID: string;
  gameID: string;
  title: string;
  thumb: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  storeName?: string;
  storeID?: string;
  addedAt: number;
  /** Baseline price captured when wishlisted — used for drop detection. */
  baselinePrice: number;
  /** Lowest price seen since wishlisting. */
  lowestPrice: number;
  /** Last time price checked. */
  lastChecked?: number;
}

/** A detected price-drop event. */
export interface PriceDropEvent {
  id: string;
  dealID: string;
  gameID: string;
  title: string;
  thumb: string;
  oldPrice: number;
  newPrice: number;
  storeName?: string;
  timestamp: number;
  dismissed?: boolean;
}
