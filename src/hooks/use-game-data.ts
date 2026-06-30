'use client';

import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import type { DealWithStore, SortOption, Store } from '@/lib/types';

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
  return useQuery({
    queryKey: ['game-detail', gameID],
    queryFn: () => fetchJson(`/api/game/${gameID}`),
    enabled: !!gameID,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameSearch(title: string, debounceMs = 350) {
  const debounced = useDebounce(title, debounceMs);
  return useQuery({
    queryKey: ['games-search', debounced],
    queryFn: () =>
      fetchJson<{ games: unknown[]; source: string }>(
        `/api/games?title=${encodeURIComponent(debounced)}`
      ),
    enabled: debounced.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
