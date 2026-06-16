import { fallbackDeals } from '@/data/fallbackDeals';

export * from '@/types/game';

import {
  EPIC_STORES,
  GOG_STORES,
  MS_STORES,
  ORIGIN_STORES,
  STEAM_STORES,
  STORE_FAVICON_MAP,
} from '@/constants/stores';
import {
  enrichWithGreyMarketDeals,
  fetchGameFromCheapShark,
  updateHistoricalLow,
} from '@/services/game-enrichment';
import type { Deal, GameDetails, Store } from '@/types/game';

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

const API_HEADERS = {
  'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)',
};

export { formatTimeAgo, getHighResImage } from '@/utils/pricing';

export function getStoreLogo(storeID: string): string | null {
  return STORE_FAVICON_MAP[storeID] ?? null;
}

export function isGreyMarketStore(storeID: string): boolean {
  return Number.parseInt(storeID, 10) >= 100;
}

export function getDrmType(storeID: string): { label: string; icon: string } {
  if (GOG_STORES.includes(storeID)) return { label: 'DRM-Free', icon: '🔓' };
  if (EPIC_STORES.includes(storeID)) return { label: 'Epic Key', icon: '🎮' };
  if (ORIGIN_STORES.includes(storeID)) return { label: 'EA App', icon: '🅰️' };
  if (MS_STORES.includes(storeID)) return { label: 'MS Store', icon: '🪟' };
  if (STEAM_STORES.includes(storeID)) return { label: 'Steam Key', icon: '🔑' };
  return { label: 'Steam Key', icon: '🔑' };
}

export function getRegionTag(_storeID: string): string | null {
  return '🇧🇷';
}

export async function getDeals(params?: Record<string, string>): Promise<Deal[]> {
  const url = new URL(`${BASE_URL}/deals`);
  if (params) {
    for (const key of Object.keys(params)) {
      url.searchParams.append(key, params[key]);
    }
  } else {
    url.searchParams.append('sortBy', 'Deal Rating');
    url.searchParams.append('onSale', '1');
    url.searchParams.append('pageSize', '20');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      headers: API_HEADERS,
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return fallbackDeals;
    const data = (await res.json()) as Deal[];
    return data.length > 0 ? data : fallbackDeals;
  } catch (_error) {
    console.error('getDeals error:', _error);
    return fallbackDeals;
  }
}

export async function getStores(): Promise<Record<string, string>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(`${BASE_URL}/stores`, {
    headers: API_HEADERS,
    signal: controller.signal,
    next: { revalidate: 86400 },
  });
  clearTimeout(timeout);
  const map: Record<string, string> = {};

  if (res.ok) {
    const stores = (await res.json()) as Store[];
    for (const s of stores) {
      map[s.storeID] = s.storeName;
    }
  }

  map['101'] = 'CDKeys';
  map['102'] = 'Kinguin';
  map['103'] = 'Eneba';
  map['104'] = 'Gamivo';

  return map;
}

export async function getGame(id: string): Promise<GameDetails> {
  try {
    const game = await fetchGameFromCheapShark(id);
    if (!game) return null as unknown as never;
    enrichWithGreyMarketDeals(game, id);
    updateHistoricalLow(game);
    return game;
  } catch (error) {
    console.error('getGame error:', error);
    return null as unknown as never;
  }
}
