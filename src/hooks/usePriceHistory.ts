'use client';

import { useQuery } from '@tanstack/react-query';
import { getDailyPriceHistoryAction } from '@/actions/deals';

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
