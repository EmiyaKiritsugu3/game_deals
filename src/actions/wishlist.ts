'use server';

/**
 * Fetches the current user's wishlist from Supabase and returns cheapsharkIds.
 * Converts UUID game IDs to cheapsharkIds for Zustand store compatibility.
 */
export async function getUserWishlistAction(): Promise<string[]> {
  throw new Error('Not implemented — Sprint 2 P1 cloud→local sync');
}
