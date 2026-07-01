import type { WishlistItem } from '@/lib/types';
import type { Deal, DealWithStore, Store } from './types';

/** Build the minimum payload needed to wishlist a deal. */
export function toWishlistPayload(
  deal: Pick<
    DealWithStore,
    | 'dealID'
    | 'gameID'
    | 'title'
    | 'thumb'
    | 'salePrice'
    | 'normalPrice'
    | 'savings'
    | 'storeID'
    | 'store'
  >
): Omit<WishlistItem, 'addedAt' | 'baselinePrice' | 'lowestPrice'> {
  return {
    dealID: deal.dealID,
    gameID: deal.gameID,
    title: deal.title,
    thumb: deal.thumb,
    salePrice: deal.salePrice,
    normalPrice: deal.normalPrice,
    savings: deal.savings,
    storeName: deal.store?.storeName,
    storeID: deal.storeID,
  };
}

const IMG_BASE = 'https://www.cheapshark.com';

/** Enrich a raw CheapShark store payload with derived URLs/flags. */
export function enrichStore<
  T extends {
    storeID: string;
    storeName: string;
    isActive: number;
    images: { banner: string; logo: string; icon: string };
  },
>(s: T) {
  return {
    ...s,
    isActiveBool: s.isActive === 1,
    bannerUrl: `${IMG_BASE}${s.images.banner}`,
    logoUrl: `${IMG_BASE}${s.images.logo}`,
    iconUrl: `${IMG_BASE}${s.images.icon}`,
  };
}

/** Normalise a raw deal into the shape the UI consumes. Pure, client-safe. */
export function normaliseDeal(d: Deal, store?: Store): DealWithStore {
  const salePriceNum = Number(d.salePrice) || 0;
  const normalPriceNum = Number(d.normalPrice) || 0;
  const savingsNum =
    Number(d.savings) ||
    (normalPriceNum > 0 ? ((normalPriceNum - salePriceNum) / normalPriceNum) * 100 : 0);
  const releaseDateMs = d.releaseDate ? d.releaseDate * 1000 : 0;
  return {
    ...d,
    store,
    salePriceNum,
    normalPriceNum,
    savingsNum,
    dealRatingNum: Number(d.dealRating) || 0,
    metacriticScoreNum: Number(d.metacriticScore) || 0,
    steamRatingNum: Number(d.steamRatingPercent) || 0,
    releaseDateMs,
    releaseDateLabel: releaseDateMs
      ? new Date(releaseDateMs).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—',
    isFree: salePriceNum === 0,
  };
}

/** Build the CheapShark redirect URL a user follows to claim a deal. */
export function dealRedirectUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(dealID)}`;
}

/**
 * Format a "last checked" relative label from a Unix-seconds timestamp
 * (CheapShark's `lastChange` field). Returns "just now", "Xm ago", "Xh ago",
 * or "Xd ago". Returns null if the timestamp is missing/invalid.
 */
export function formatLastChecked(
  lastChangeSeconds: number | string | undefined | null
): string | null {
  if (!lastChangeSeconds) return null;
  const ts = typeof lastChangeSeconds === 'string' ? Number(lastChangeSeconds) : lastChangeSeconds;
  if (!ts || ts <= 0 || !Number.isFinite(ts)) return null;
  // CheapShark uses Unix seconds; convert to ms.
  const ms = ts * 1000;
  const diff = Date.now() - ms;
  if (diff < 0) return 'just now'; // clock skew — treat as fresh
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns true if the deal's lastChange is within the last N minutes
 * (i.e. the price was very recently verified).
 */
export function isRecentlyVerified(
  lastChangeSeconds: number | string | undefined | null,
  withinMinutes = 10
): boolean {
  if (!lastChangeSeconds) return false;
  const ts = typeof lastChangeSeconds === 'string' ? Number(lastChangeSeconds) : lastChangeSeconds;
  if (!ts || ts <= 0 || !Number.isFinite(ts)) return false;
  const diffMs = Date.now() - ts * 1000;
  return diffMs >= 0 && diffMs <= withinMinutes * 60_000;
}
