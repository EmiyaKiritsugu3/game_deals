'use client';

import { useQuery } from '@tanstack/react-query';
import { getDailyPriceHistoryAction, getWeeklyPriceHistoryAction } from '@/actions/deals';

/**
 * Hook pra buscar preço histórico diário
 */
export function useDailyPriceHistory(gameId: string | null, days = 90) {
  return useQuery({
    queryKey: ['priceHistory', 'daily', gameId, days],
    queryFn: () => getDailyPriceHistoryAction(gameId ?? '', days),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Hook pra buscar preço histórico semanal
 */
export function useWeeklyPriceHistory(gameId: string | null, weeks = 26) {
  return useQuery({
    queryKey: ['priceHistory', 'weekly', gameId, weeks],
    queryFn: () => getWeeklyPriceHistoryAction(gameId ?? '', weeks),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
