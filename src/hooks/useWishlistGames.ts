import { useQuery } from '@tanstack/react-query';
import { getGame, getStores } from '@/services/api';
import type { GameDetails } from '@/types/game';

interface WishlistData {
  stores: Record<string, string>;
  games: Array<GameDetails | null>;
}

export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async (): Promise<WishlistData> => {
      if (gameIds.length === 0) return { stores: {}, games: [] };
      const stores = await getStores();
      const games = await Promise.all(gameIds.map((id) => getGame(id).catch(() => null)));
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
