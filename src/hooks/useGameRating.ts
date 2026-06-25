'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAvgRating, getGameRating, rateGame } from '@/actions/ratings';

export function useGameRating(gameId: string) {
  return useQuery({
    queryKey: ['game-rating', gameId],
    queryFn: () => getGameRating(gameId),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameAvgRating(gameId: string) {
  return useQuery({
    queryKey: ['game-avg-rating', gameId],
    queryFn: () => getAvgRating(gameId),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRateGame(gameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rating: number) => rateGame(gameId, rating),
    onMutate: async (rating) => {
      await queryClient.cancelQueries({ queryKey: ['game-rating', gameId] });
      const previous = queryClient.getQueryData(['game-rating', gameId]);
      queryClient.setQueryData(['game-rating', gameId], { rating });
      return { previous };
    },
    onError: (_err, _rating, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['game-rating', gameId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['game-rating', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game-avg-rating', gameId] });
    },
  });
}
