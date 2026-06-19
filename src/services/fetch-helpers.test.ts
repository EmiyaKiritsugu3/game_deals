import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fallbackDeals } from '@/data/fallbackDeals';
import { fetchDealsWithFallback, fetchGameDetails } from './fetch-helpers';

describe('fetchDealsWithFallback', () => {
  const mockFetch = vi.fn();
  const mockConsoleError = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('console', { ...console, error: mockConsoleError });
    mockFetch.mockReset();
    mockConsoleError.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns fallbackDeals when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve([]),
    });

    const result = await fetchDealsWithFallback('https://www.cheapshark.com/api/1.0/deals');

    expect(result).toEqual(fallbackDeals);
  });

  it('returns fallbackDeals and logs error when fetch throws', async () => {
    const networkError = new Error('Network failure');
    mockFetch.mockRejectedValueOnce(networkError);

    const result = await fetchDealsWithFallback('https://www.cheapshark.com/api/1.0/deals');

    expect(result).toEqual(fallbackDeals);
    expect(mockConsoleError).toHaveBeenCalledWith('fetchDeals error:', networkError);
  });

  it('returns parsed data when response is ok with data', async () => {
    const sampleDeals = [
      {
        internalName: 'TESTGAME',
        title: 'Test Game',
        metacriticLink: '/game/pc/test-game',
        dealID: 'deal_001',
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
        releaseDate: 1_600_000_000,
        lastChange: 1_600_000_000,
        dealRating: '8.5',
        thumb: 'https://example.com/thumb.jpg',
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDeals),
    });

    const result = await fetchDealsWithFallback('https://www.cheapshark.com/api/1.0/deals');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      internalName: 'TESTGAME',
      title: 'Test Game',
      dealID: 'deal_001',
      salePrice: '9.99',
    });
    expect(result[0].metacriticScore).toBe('80');
    expect(result[0].steamRatingPercent).toBe('90');
    expect(result[0].thumb).toBe('https://example.com/thumb.jpg');
  });

  it('returns fallbackDeals when response data is empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await fetchDealsWithFallback('https://www.cheapshark.com/api/1.0/deals');

    expect(result).toEqual(fallbackDeals);
  });

  it('returns fallbackDeals when JSON parsing fails', async () => {
    const parseError = new Error('Unexpected token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(parseError),
    });

    const result = await fetchDealsWithFallback('https://www.cheapshark.com/api/1.0/deals');

    expect(result).toEqual(fallbackDeals);
    expect(mockConsoleError).toHaveBeenCalledWith('fetchDeals error:', parseError);
  });

  it('uses custom errorContext in console.error on failure', async () => {
    const customError = new Error('Custom context error');
    mockFetch.mockRejectedValueOnce(customError);

    const result = await fetchDealsWithFallback(
      'https://www.cheapshark.com/api/1.0/deals',
      'customContext'
    );

    expect(result).toEqual(fallbackDeals);
    expect(mockConsoleError).toHaveBeenCalledWith('customContext error:', customError);
  });
});

describe('fetchGameDetails', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed game details when response is ok', async () => {
    const sampleDetails = {
      info: {
        title: 'Test Game',
        steamAppID: '12345',
        thumb: 'https://example.com/thumb.jpg',
      },
      cheapestPriceEver: { price: '9.99', date: 1_600_000_000 },
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDetails),
    });

    const result = await fetchGameDetails('123');

    expect(result).toEqual(sampleDetails);
  });

  it('returns null when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });
    const result = await fetchGameDetails('123');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchGameDetails('123');
    expect(result).toBeNull();
  });
});
