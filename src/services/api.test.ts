import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchGameFromCheapShark = vi.hoisted(() => vi.fn());
const mockEnrichWithGreyMarketDeals = vi.hoisted(() => vi.fn());
const mockUpdateHistoricalLow = vi.hoisted(() => vi.fn());

vi.mock('@/services/game-enrichment', () => ({
  fetchGameFromCheapShark: mockFetchGameFromCheapShark,
  enrichWithGreyMarketDeals: mockEnrichWithGreyMarketDeals,
  updateHistoricalLow: mockUpdateHistoricalLow,
}));

import { fallbackDeals } from '@/data/fallbackDeals';
import {
  formatTimeAgo,
  getDeals,
  getDrmType,
  getGame,
  getHighResImage,
  getRegionTag,
  getStoreLogo,
  getStores,
  isGreyMarketStore,
} from './api';

// ---------------------------------------------------------------------------
// Pure / synchronous helpers
// ---------------------------------------------------------------------------

describe('getStoreLogo', () => {
  it('returns favicon URL for known storeIDs', () => {
    expect(getStoreLogo('1')).toBe('https://www.steampowered.com/favicon.ico');
    expect(getStoreLogo('7')).toBe('https://www.gog.com/favicon.ico');
    expect(getStoreLogo('24')).toBe('https://www.epic.com/favicon.ico');
    expect(getStoreLogo('101')).toBe('https://www.cdkeys.com/favicon.ico');
  });

  it('returns null for unknown storeIDs', () => {
    expect(getStoreLogo('999')).toBeNull();
    expect(getStoreLogo('')).toBeNull();
  });
});

describe('isGreyMarketStore', () => {
  it('returns true for storeID >= 100', () => {
    expect(isGreyMarketStore('100')).toBe(true);
    expect(isGreyMarketStore('101')).toBe(true);
    expect(isGreyMarketStore('200')).toBe(true);
  });

  it('returns false for storeID < 100', () => {
    expect(isGreyMarketStore('1')).toBe(false);
    expect(isGreyMarketStore('34')).toBe(false);
    expect(isGreyMarketStore('99')).toBe(false);
  });
});

describe('getDrmType', () => {
  it('returns DRM-Free for GOG stores', () => {
    expect(getDrmType('7')).toEqual({ label: 'DRM-Free', icon: '🔓' });
  });

  it('returns Epic Key for Epic stores', () => {
    expect(getDrmType('24')).toEqual({ label: 'Epic Key', icon: '🎮' });
    expect(getDrmType('28')).toEqual({ label: 'Epic Key', icon: '🎮' });
  });

  it('returns EA App for Origin stores', () => {
    expect(getDrmType('8')).toEqual({ label: 'EA App', icon: '🅰️' });
  });

  it('returns MS Store for Microsoft stores', () => {
    expect(getDrmType('34')).toEqual({ label: 'MS Store', icon: '🪟' });
  });

  it('returns Steam Key for Steam and default stores', () => {
    expect(getDrmType('1')).toEqual({ label: 'Steam Key', icon: '🔑' });
    expect(getDrmType('13')).toEqual({ label: 'Steam Key', icon: '🔑' });
    expect(getDrmType('101')).toEqual({ label: 'Steam Key', icon: '🔑' });
    expect(getDrmType('999')).toEqual({ label: 'Steam Key', icon: '🔑' });
  });
});

describe('getRegionTag', () => {
  it('always returns Brazilian flag', () => {
    expect(getRegionTag('1')).toBe('🇧🇷');
    expect(getRegionTag('999')).toBe('🇧🇷');
  });
});

describe('getHighResImage', () => {
  it('replaces capsule_sm_120 with header in URL', () => {
    const input = 'https://example.com/capsule_sm_120.jpg';
    expect(getHighResImage(input)).toBe('https://example.com/header.jpg');
  });

  it('returns URL unchanged if no capsule_sm_120', () => {
    const input = 'https://example.com/header.jpg';
    expect(getHighResImage(input)).toBe(input);
  });
});

describe('formatTimeAgo', () => {
  const now = Math.floor(Date.now() / 1000);

  it('returns "just now" for < 60 seconds', () => {
    expect(formatTimeAgo(now - 30)).toBe('just now');
  });

  it('returns minutes ago for < 3600 seconds', () => {
    expect(formatTimeAgo(now - 120)).toBe('2m ago');
    expect(formatTimeAgo(now - 3599)).toBe('59m ago');
  });

  it('returns hours ago for < 86400 seconds', () => {
    expect(formatTimeAgo(now - 7200)).toBe('2h ago');
    expect(formatTimeAgo(now - 86399)).toBe('23h ago');
  });

  it('returns days ago for < 2592000 seconds', () => {
    expect(formatTimeAgo(now - 172800)).toBe('2d ago');
    expect(formatTimeAgo(now - 2591999)).toBe('29d ago');
  });

  it('returns months ago for >= 2592000 seconds', () => {
    expect(formatTimeAgo(now - 5184000)).toBe('2mo ago');
  });
});

// ---------------------------------------------------------------------------
// getDeals — fetch-based
// ---------------------------------------------------------------------------

describe('getDeals', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  const sampleDeals = [
    {
      internalName: 'TESTGAME',
      title: 'Test Game',
      dealID: 'test123',
      storeID: '1',
      gameID: '999',
      salePrice: '9.99',
      normalPrice: '19.99',
      isOnSale: '1',
      savings: '50.00',
      metacriticScore: '80',
      steamRatingText: 'Very Positive',
      steamRatingPercent: '90',
      steamRatingCount: '1000',
      steamAppID: '12345',
      releaseDate: 1600000000,
      lastChange: 1600000000,
      dealRating: '8.5',
      thumb: 'https://example.com/thumb.jpg',
      metacriticLink: '/game/pc/test-game',
    },
  ];

  const defaultDealUrl =
    'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal+Rating&onSale=1&pageSize=20';

  it('fetches deals with default params when none provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDeals),
    });

    const result = await getDeals();

    expect(mockFetch).toHaveBeenCalledWith(defaultDealUrl, {
      headers: { 'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)' },
      signal: expect.any(AbortSignal),
      next: { revalidate: 3600 },
    });
    expect(result).toEqual(sampleDeals);
  });

  it('passes custom query params correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDeals),
    });

    await getDeals({ storeID: '1', pageSize: '5' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=5',
      {
        headers: { 'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)' },
        signal: expect.any(AbortSignal),
        next: { revalidate: 3600 },
      }
    );
  });

  it('returns fallbackDeals when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve([]),
    });

    const result = await getDeals();

    expect(result).toEqual(fallbackDeals);
  });

  it('returns fallbackDeals when response has empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await getDeals();

    expect(result).toEqual(fallbackDeals);
  });

  it('returns fallbackDeals when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const result = await getDeals();

    expect(result).toEqual(fallbackDeals);
  });

  it('returns fallbackDeals when JSON is malformed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token')),
    });

    const result = await getDeals();

    expect(result).toEqual(fallbackDeals);
  });
});

// ---------------------------------------------------------------------------
// getStores — fetch-based
// ---------------------------------------------------------------------------

describe('getStores', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  it('returns store map from CheapShark plus grey-market stores on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { storeID: '1', storeName: 'Steam', isActive: 1 },
          { storeID: '7', storeName: 'GOG', isActive: 1 },
        ]),
    });

    const result = await getStores();

    expect(result['1']).toBe('Steam');
    expect(result['7']).toBe('GOG');
    expect(result['101']).toBe('CDKeys');
    expect(result['102']).toBe('Kinguin');
    expect(result['103']).toBe('Eneba');
    expect(result['104']).toBe('Gamivo');
  });

  it('returns only grey-market stores when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve([]),
    });

    const result = await getStores();

    expect(Object.keys(result)).toHaveLength(4);
    expect(result['101']).toBe('CDKeys');
    expect(result['102']).toBe('Kinguin');
    expect(result['103']).toBe('Eneba');
    expect(result['104']).toBe('Gamivo');
  });

  it('calls CheapShark stores endpoint with 86400 revalidate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getStores();

    expect(mockFetch).toHaveBeenCalledWith('https://www.cheapshark.com/api/1.0/stores', {
      headers: { 'User-Agent': 'GameDeals/1.0 (https://gamedeals.com.br)' },
      signal: expect.any(AbortSignal),
      next: { revalidate: 86400 },
    });
  });
});

// ---------------------------------------------------------------------------
// getGame — delegates to game-enrichment
// ---------------------------------------------------------------------------

describe('getGame', () => {
  beforeEach(() => {
    mockFetchGameFromCheapShark.mockReset();
    mockEnrichWithGreyMarketDeals.mockReset();
    mockUpdateHistoricalLow.mockReset();
  });

  const sampleGameDetails = {
    info: { title: 'Test Game', steamAppID: '12345', thumb: 'https://example.com/thumb.jpg' },
    cheapestPriceEver: { price: '9.99', date: 1600000000 },
    deals: [
      {
        storeID: '1',
        dealID: 'd1',
        price: '9.99',
        retailPrice: '19.99',
        savings: '50.00',
        dealRating: '8.5',
      },
    ],
  };

  it('returns enriched game details on success', async () => {
    mockFetchGameFromCheapShark.mockResolvedValueOnce(sampleGameDetails);

    const result = await getGame('123');

    expect(mockFetchGameFromCheapShark).toHaveBeenCalledWith('123');
    expect(mockEnrichWithGreyMarketDeals).toHaveBeenCalledWith(sampleGameDetails, '123');
    expect(mockUpdateHistoricalLow).toHaveBeenCalledWith(sampleGameDetails);
    expect(result).toEqual(sampleGameDetails);
  });

  it('enrichWithGreyMarketDeals and updateHistoricalLow receive the correct game', async () => {
    mockFetchGameFromCheapShark.mockResolvedValueOnce(sampleGameDetails);

    await getGame('abc');

    // Verify that enrich/update are called with the exact same object
    const gameArg = mockEnrichWithGreyMarketDeals.mock.calls[0][0];
    expect(gameArg).toBe(sampleGameDetails);
    const gameArg2 = mockUpdateHistoricalLow.mock.calls[0][0];
    expect(gameArg2).toBe(sampleGameDetails);
  });

  it('returns nullish when fetchGameFromCheapShark returns null', async () => {
    mockFetchGameFromCheapShark.mockResolvedValueOnce(null);

    const result = await getGame('456');

    expect(mockEnrichWithGreyMarketDeals).not.toHaveBeenCalled();
    expect(mockUpdateHistoricalLow).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns nullish when fetchGameFromCheapShark throws', async () => {
    mockFetchGameFromCheapShark.mockRejectedValueOnce(new Error('API error'));

    const result = await getGame('789');

    expect(mockEnrichWithGreyMarketDeals).not.toHaveBeenCalled();
    expect(mockUpdateHistoricalLow).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
