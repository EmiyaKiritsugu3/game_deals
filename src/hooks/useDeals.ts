'use client';

import { useQuery } from '@tanstack/react-query';
import { getDealsAction, getGameAction, getStoresAction } from '@/actions/deals';
import { searchGamesAction } from '@/actions/search';

interface UseDealsParams {
  sortBy?: string;
  onSale?: string;
  pageSize?: string;
  upperPrice?: string;
  lowerPrice?: string;
  storeID?: string;
}

/**
 * Hook pra buscar deals na home page
 * Cache: staleTime 5min, gcTime 10min
 */
export function useDeals(params?: UseDealsParams) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => getDealsAction(params),
    staleTime: 5 * 60 * 1000, // 5min
    gcTime: 10 * 60 * 1000, // 10min
  });
}

/**
 * Hook pra buscar detalhes de um jogo
 */
export function useGame(id: string | null) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => getGameAction(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook pra buscar lojas (mapa storeID → nome)
 */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: getStoresAction,
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  });
}

/**
 * Hook pra search de jogos
 * Debounce: o componente deve debounce antes de chamar
 */
export function useSearchGames(title: string) {
  return useQuery({
    queryKey: ['search', title],
    queryFn: () => searchGamesAction(title),
    enabled: title.length >= 2,
    staleTime: 60 * 1000, // 1min
    gcTime: 5 * 60 * 1000, // 5min
  });
}
