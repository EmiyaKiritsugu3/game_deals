'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceDropEvent, WishlistItem } from '@/lib/types';

interface WishlistState {
  // Source-of-truth
  items: WishlistItem[];
  isOpen: boolean;
  recentlyViewed: WishlistItem[];
  priceDrops: PriceDropEvent[];

  // New rich API
  add: (item: Omit<WishlistItem, 'addedAt' | 'baselinePrice' | 'lowestPrice'>) => void;
  remove: (dealID: string) => void;
  toggle: (item: Omit<WishlistItem, 'addedAt' | 'baselinePrice' | 'lowestPrice'>) => void;
  has: (dealID: string) => boolean;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
  addRecentlyViewed: (
    item: Omit<WishlistItem, 'addedAt' | 'baselinePrice' | 'lowestPrice'>
  ) => void;
  recordPriceCheck: (dealID: string, currentPrice: number, storeName?: string) => void;
  dismissPriceDrop: (id: string) => void;
  clearPriceDrops: () => void;

  // Legacy compat API (string-based) — derived from items
  wishlist: string[];
  addToWishlist: (gameID: string) => void;
  removeFromWishlist: (gameID: string) => void;
  toggleWishlist: (gameID: string) => void;
  isInWishlist: (gameID: string) => boolean;
  setWishlist: (ids: string[]) => void;
}

function deriveWishlist(items: WishlistItem[]): string[] {
  return items.map((i) => i.dealID);
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      recentlyViewed: [],
      priceDrops: [],

      // Derived: string[] view of items (computed in each action, not a getter)
      wishlist: [],

      // --- New rich API ---

      add: (item) => {
        const price = Number(item.salePrice) || 0;
        set((s) =>
          s.items.some((i) => i.dealID === item.dealID)
            ? s
            : (() => {
                const newItems = [
                  {
                    ...item,
                    addedAt: Date.now(),
                    baselinePrice: price,
                    lowestPrice: price,
                  },
                  ...s.items,
                ];
                return { items: newItems, wishlist: deriveWishlist(newItems) };
              })()
        );
      },

      remove: (dealID) =>
        set((s) => {
          const newItems = s.items.filter((i) => i.dealID !== dealID);
          return {
            items: newItems,
            wishlist: deriveWishlist(newItems),
            priceDrops: s.priceDrops.filter((p) => p.dealID !== dealID),
          };
        }),

      toggle: (item) => {
        const exists = get().items.some((i) => i.dealID === item.dealID);
        if (exists) {
          get().remove(item.dealID);
        } else {
          get().add(item);
        }
      },

      has: (dealID) => get().items.some((i) => i.dealID === dealID),

      clear: () => set({ items: [], wishlist: [], priceDrops: [] }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (v) => set({ isOpen: v }),

      addRecentlyViewed: (item) =>
        set((s) => {
          const filtered = s.recentlyViewed.filter((i) => i.dealID !== item.dealID);
          const price = Number(item.salePrice) || 0;
          return {
            recentlyViewed: [
              {
                ...item,
                addedAt: Date.now(),
                baselinePrice: price,
                lowestPrice: price,
              },
              ...filtered,
            ].slice(0, 8),
          };
        }),

      recordPriceCheck: (dealID, currentPrice, storeName) => {
        const item = get().items.find((i) => i.dealID === dealID);
        if (!item) return;
        const now = Date.now();

        if (currentPrice < item.lowestPrice && item.lowestPrice > 0) {
          const dropId = `${dealID}-${now}`;
          const drop: PriceDropEvent = {
            id: dropId,
            dealID,
            gameID: item.gameID,
            title: item.title,
            thumb: item.thumb,
            oldPrice: item.lowestPrice,
            newPrice: currentPrice,
            storeName: storeName ?? item.storeName,
            timestamp: now,
          };
          set((s) => {
            const newItems = s.items.map((i) =>
              i.dealID === dealID ? { ...i, lowestPrice: currentPrice, lastChecked: now } : i
            );
            return {
              items: newItems,
              wishlist: deriveWishlist(newItems),
              priceDrops: [drop, ...s.priceDrops].slice(0, 20),
            };
          });
        } else {
          set((s) => {
            const newItems = s.items.map((i) =>
              i.dealID === dealID ? { ...i, lastChecked: now } : i
            );
            return {
              items: newItems,
              wishlist: deriveWishlist(newItems),
            };
          });
        }
      },

      dismissPriceDrop: (id) =>
        set((s) => ({
          priceDrops: s.priceDrops.filter((p) => p.id !== id),
        })),

      clearPriceDrops: () => set({ priceDrops: [] }),

      // --- Legacy compat API (string-based) ---

      addToWishlist: (gameID) => {
        const { items, has } = get();
        if (has(gameID)) return;
        const newItems = [
          ...items,
          {
            dealID: gameID,
            gameID,
            title: '',
            thumb: '',
            salePrice: '0',
            normalPrice: '0',
            savings: '0',
            addedAt: Date.now(),
            baselinePrice: 0,
            lowestPrice: 0,
          },
        ];
        set({ items: newItems, wishlist: deriveWishlist(newItems) });
      },

      removeFromWishlist: (gameID) => get().remove(gameID),

      toggleWishlist: (gameID) => {
        const exists = get().items.some((i) => i.dealID === gameID);
        if (exists) {
          get().remove(gameID);
        } else {
          get().addToWishlist(gameID);
        }
      },

      isInWishlist: (gameID) => get().items.some((i) => i.dealID === gameID),

      setWishlist: (ids) =>
        set(() => {
          const currentItems = get().items;
          const newItems = ids.map((id) => {
            const existing = currentItems.find((i) => i.dealID === id);
            return (
              existing ?? {
                dealID: id,
                gameID: id,
                title: '',
                thumb: '',
                salePrice: '0',
                normalPrice: '0',
                savings: '0',
                addedAt: Date.now(),
                baselinePrice: 0,
                lowestPrice: 0,
              }
            );
          });
          return { items: newItems, wishlist: deriveWishlist(newItems) };
        }),
    }),
    {
      name: 'gameDeals_wishlist',
      partialize: (s) => ({
        items: s.items,
        recentlyViewed: s.recentlyViewed,
        priceDrops: s.priceDrops,
      }),
    }
  )
);
