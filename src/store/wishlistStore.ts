import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
    wishlist: string[];
    addToWishlist: (gameID: string) => void;
    removeFromWishlist: (gameID: string) => void;
    toggleWishlist: (gameID: string) => void;
    isInWishlist: (gameID: string) => boolean;
}

export const useWishlist = create<WishlistState>()(
    persist(
        (set, get) => ({
            wishlist: [],
            addToWishlist: (gameID: string) => set((state) => ({
                wishlist: state.wishlist.includes(gameID) 
                    ? state.wishlist 
                    : [...state.wishlist, gameID]
            })),
            removeFromWishlist: (gameID: string) => set((state) => ({
                wishlist: state.wishlist.filter(id => id !== gameID)
            })),
            toggleWishlist: (gameID: string) => set((state) => {
                const isSaved = state.wishlist.includes(gameID);
                return {
                    wishlist: isSaved 
                        ? state.wishlist.filter(id => id !== gameID)
                        : [...state.wishlist, gameID]
                };
            }),
            isInWishlist: (gameID: string) => get().wishlist.includes(gameID),
        }),
        {
            name: 'gameDeals_wishlist',
        }
    )
);
