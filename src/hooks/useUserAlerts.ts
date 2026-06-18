'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserAlertsAction } from '@/actions/alerts';

export function useUserAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => getUserAlertsAction(),
    enabled,
    staleTime: 30 * 1000,
  });
}
