'use client';

import { useQuery } from '@tanstack/react-query';
import type { DealWithStore, GameDealEntry, SortOption, Store } from '@/lib/types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface DealsQuery {
  sortBy?: SortOption;
  storeID?: string;
  title?: string;
  onSale?: boolean;
  pageSize?: number;
  lowerPrice?: number;
  upperPrice?: number;
  free?: boolean;
}

export function useDeals(query: DealsQuery) {
  const params = new URLSearchParams();
  params.set('sortBy', query.sortBy ?? 'deal-rating');
  if (query.storeID) params.set('storeID', query.storeID);
  if (query.title) params.set('title', query.title);
  if (query.onSale) params.set('onSale', '1');
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.free) params.set('free', '1');
  if (query.lowerPrice !== undefined) params.set('lowerPrice', String(query.lowerPrice));
  if (query.upperPrice !== undefined) params.set('upperPrice', String(query.upperPrice));

  return useQuery<{
    deals: DealWithStore[];
    source: string;
    count: number;
  }>({
    queryKey: ['deals', params.toString()],
    queryFn: () => fetchJson(`/api/deals?${params.toString()}`),
  });
}

/** Dedicated hook for 100%-off free games. */
export function useFreeGames(enabled = true) {
  return useQuery<{
    deals: DealWithStore[];
    source: string;
    count: number;
  }>({
    queryKey: ['deals', 'free-games'],
    queryFn: () => fetchJson(`/api/deals?free=1&sortBy=recent&pageSize=20`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Dedicated hook for newly-released games (sorted by release date). */
export function useNewlyAdded(enabled = true) {
  return useQuery<{
    deals: DealWithStore[];
    source: string;
    count: number;
  }>({
    queryKey: ['deals', 'newly-added'],
    queryFn: () => fetchJson(`/api/deals?sortBy=recent&pageSize=30`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStores() {
  return useQuery<{ stores: Store[]; source: string }>({
    queryKey: ['stores'],
    queryFn: () => fetchJson('/api/stores'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useGameDetail(gameID: string | null) {
  return useQuery<{
    deals: GameDealEntry[];
    storeDeals: GameDealEntry[];
    cheapestPriceEver: { price: string; date: number } | null;
  }>({
    queryKey: ['game-detail', gameID],
    queryFn: () => fetchJson(`/api/game/${gameID}`),
    enabled: !!gameID,
    staleTime: 5 * 60 * 1000,
  });
}
