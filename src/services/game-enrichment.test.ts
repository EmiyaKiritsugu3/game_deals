import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameDetails } from '@/types/game';

const mockGenerateGreyMarketDeals = vi.hoisted(() => vi.fn());

vi.mock('@/utils/pricing', () => ({
  generateGreyMarketDeals: mockGenerateGreyMarketDeals,
}));

import {
  enrichWithGreyMarketDeals,
  fetchGameFromCheapShark,
  fetchGamesBatchFromCheapShark,
  updateHistoricalLow,
} from './game-enrichment';

const MOCK_INFO = {
  title: 'Test Game',
  steamAppID: '12345',
  thumb: 'https://example.com/thumb.jpg',
};

function createGame(overrides?: Partial<GameDetails>): GameDetails {
  return {
    info: MOCK_INFO,
    cheapestPriceEver: { price: '10.00', date: 1_600_000_000 },
    deals: [],
    ...overrides,
  };
}

const MOCK_GREY_DEALS = [
  {
    storeID: '101',
    dealID: 'grey-101-test',
    price: '8.49',
    retailPrice: '19.99',
    savings: '57.530000',
    dealRating: '0.0',
  },
];

describe('fetchGamesBatchFromCheapShark', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when ids array is empty', async () => {
    const result = await fetchGamesBatchFromCheapShark([]);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await fetchGamesBatchFromCheapShark(['123', '456']);

    expect(result).toBeNull();
  });

  it('returns parsed Record<string, GameDetails> on success', async () => {
    const gameData1 = createGame({ deals: [] });
    const gameData2 = createGame({ deals: [] });
    const responseData = { '123': gameData1, '456': gameData2 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    });

    const result = await fetchGamesBatchFromCheapShark(['123', '456']);

    expect(result).toEqual(responseData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ids=123%2C456'),
      expect.any(Object)
    );
  });

  it('returns null when fetch throws', async () => {
    vi.useFakeTimers();
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const promise = fetchGamesBatchFromCheapShark(['789']);
    vi.advanceTimersByTime(8_000);
    const result = await promise;

    expect(result).toBeNull();
    vi.useRealTimers();
  });
});

describe('fetchGameFromCheapShark', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await fetchGameFromCheapShark('123');

    expect(result).toBeNull();
  });

  it('returns parsed GameDetails on success', async () => {
    const gameData = createGame({
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
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(gameData),
    });

    const result = await fetchGameFromCheapShark('456');

    expect(result).toEqual(gameData);
  });

  it('returns null when fetch throws', async () => {
    vi.useFakeTimers();
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const promise = fetchGameFromCheapShark('789');
    vi.advanceTimersByTime(5_000);
    const result = await promise;

    expect(result).toBeNull();
    vi.useRealTimers();
  });
});

describe('enrichWithGreyMarketDeals', () => {
  beforeEach(() => {
    mockGenerateGreyMarketDeals.mockReset();
  });

  it('mutates deals when game has non-empty deals', () => {
    mockGenerateGreyMarketDeals.mockReturnValueOnce(MOCK_GREY_DEALS);

    const game = createGame({
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
    });

    const originalDeals = game.deals;
    enrichWithGreyMarketDeals(game, 'test-id');

    expect(mockGenerateGreyMarketDeals).toHaveBeenCalledTimes(1);
    expect(mockGenerateGreyMarketDeals).toHaveBeenCalledWith(originalDeals, 'test-id');
    expect(game.deals).toHaveLength(2);
    expect(game.deals[1]).toEqual(MOCK_GREY_DEALS[0]);
  });

  it('no-ops when game.deals is empty', () => {
    mockGenerateGreyMarketDeals.mockReturnValueOnce(MOCK_GREY_DEALS);

    const game = createGame({ deals: [] });
    const originalDeals = game.deals;

    enrichWithGreyMarketDeals(game, 'test-id');

    expect(mockGenerateGreyMarketDeals).not.toHaveBeenCalled();
    expect(game.deals).toBe(originalDeals);
    expect(game.deals).toHaveLength(0);
  });
});

describe('updateHistoricalLow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates historical low when current price is lower, no-ops otherwise', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-19'));
    const expectedDate = Math.floor(new Date('2026-06-19').getTime() / 1000);

    const emptyDealGame = createGame({
      cheapestPriceEver: { price: '10.00', date: 1_000 },
      deals: [],
    });
    updateHistoricalLow(emptyDealGame);
    expect(emptyDealGame.cheapestPriceEver.price).toBe('10.00');
    expect(emptyDealGame.cheapestPriceEver.date).toBe(1_000);

    const nullPriceEverGame = createGame({
      cheapestPriceEver: null as unknown as { price: string; date: number },
      deals: [
        {
          storeID: '1',
          dealID: 'd1',
          price: '8.00',
          retailPrice: '19.99',
          savings: '59.97',
          dealRating: '7.5',
        },
      ],
    });
    updateHistoricalLow(nullPriceEverGame);
    expect(nullPriceEverGame.cheapestPriceEver).toBeNull();

    const sameGame = createGame({
      cheapestPriceEver: { price: '5.00', date: 2_000 },
      deals: [
        {
          storeID: '1',
          dealID: 'd1',
          price: '10.00',
          retailPrice: '19.99',
          savings: '50.00',
          dealRating: '8.5',
        },
        {
          storeID: '2',
          dealID: 'd2',
          price: '12.00',
          retailPrice: '24.99',
          savings: '51.98',
          dealRating: '7.0',
        },
      ],
    });
    updateHistoricalLow(sameGame);
    expect(sameGame.cheapestPriceEver.price).toBe('5.00');
    expect(sameGame.cheapestPriceEver.date).toBe(2_000);

    const game = createGame({
      cheapestPriceEver: { price: '10.00', date: 1_000 },
      deals: [
        {
          storeID: '1',
          dealID: 'd1',
          price: '5.00',
          retailPrice: '19.99',
          savings: '75.00',
          dealRating: '9.0',
        },
        {
          storeID: '2',
          dealID: 'd2',
          price: '8.00',
          retailPrice: '19.99',
          savings: '60.00',
          dealRating: '7.0',
        },
      ],
    });
    updateHistoricalLow(game);
    expect(game.cheapestPriceEver.price).toBe('5.00');
    expect(game.cheapestPriceEver.date).toBe(expectedDate);
  });
});
