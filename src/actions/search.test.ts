import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockTypesenseSearch,
  mockIndexGamesBatch,
  mockCaptureException,
  mockMapDealsToTypesenseGames,
  mockFetchCheapSharkDeals,
} = vi.hoisted(() => ({
  mockTypesenseSearch: vi.fn(),
  mockIndexGamesBatch: vi.fn(),
  mockCaptureException: vi.fn(),
  mockMapDealsToTypesenseGames: vi.fn(),
  mockFetchCheapSharkDeals: vi.fn(),
}));

let originalFetch: typeof globalThis.fetch;

vi.mock('@/lib/typesense', () => ({
  searchGames: mockTypesenseSearch,
  indexGamesBatch: mockIndexGamesBatch,
}));

vi.mock('@/lib/typesense-map', () => ({
  mapDealsToTypesenseGames: mockMapDealsToTypesenseGames,
}));

vi.mock('@/services/ingest', () => ({
  fetchCheapSharkDeals: mockFetchCheapSharkDeals,
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}));

beforeEach(() => {
  mockTypesenseSearch.mockReset();
  mockIndexGamesBatch.mockReset();
  mockCaptureException.mockReset();
  mockMapDealsToTypesenseGames.mockReset();
  mockFetchCheapSharkDeals.mockReset();
  delete process.env.TYPESENSE_ADMIN_KEY;
  delete process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function importModule() {
  return import('./search');
}

describe('searchGamesAction', () => {
  it('returns results from Typesense when api key is configured', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-admin-key';
    mockTypesenseSearch.mockResolvedValueOnce([
      {
        document: {
          gameID: '123',
          title: 'The Legend of Zelda',
          thumb: 'https://example.com/zelda.jpg',
          cheapest: '29.99',
        },
      },
    ]);

    const { searchGamesAction } = await importModule();
    const results = await searchGamesAction('zelda');

    expect(mockTypesenseSearch).toHaveBeenCalledWith('zelda', 10);
    expect(results).toEqual([
      {
        gameID: '123',
        external: 'The Legend of Zelda',
        thumb: 'https://example.com/zelda.jpg',
        cheapest: '29.99',
      },
    ]);
  });

  it('returns empty array when Typesense throws an error', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-admin-key';
    mockTypesenseSearch.mockRejectedValueOnce(new Error('Typesense connection refused'));

    const { searchGamesAction } = await importModule();
    const results = await searchGamesAction('zelda');

    expect(results).toEqual([]);
    expect(mockTypesenseSearch).toHaveBeenCalledWith('zelda', 10);
  });

  it('falls back to CheapShark when no api key is configured and returns results', async () => {
    const mockData = [
      {
        gameID: '123',
        external: 'Zelda',
        thumb: '/zelda.jpg',
        cheapest: '29.99',
      },
    ];
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { searchGamesAction } = await importModule();
    const results = await searchGamesAction('zelda');

    expect(mockTypesenseSearch).not.toHaveBeenCalled();
    expect(results).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('cheapshark.com/api/1.0/games?title=zelda'),
      expect.objectContaining({
        headers: { 'User-Agent': 'GameDeals/1.0' },
      })
    );
  });

  it('returns empty array when CheapShark fallback returns non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
    });

    const { searchGamesAction } = await importModule();
    const results = await searchGamesAction('zelda');

    expect(results).toEqual([]);
    expect(mockTypesenseSearch).not.toHaveBeenCalled();
  });

  it('returns empty array when CheapShark fallback throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failure'));

    const { searchGamesAction } = await importModule();
    const results = await searchGamesAction('zelda');

    expect(results).toEqual([]);
    expect(mockTypesenseSearch).not.toHaveBeenCalled();
    expect(mockCaptureException).toHaveBeenCalled();
  });
});

describe('syncGamesToTypesenseAction', () => {
  it('returns error when TYPESENSE_ADMIN_KEY is not set', async () => {
    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'Typesense not configured',
    });
  });

  it('returns "No deals fetched" when fetch returns empty', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockResolvedValueOnce([]);

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'No deals fetched',
    });
  });

  it('returns "No deals fetched" when fetch throws', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockRejectedValueOnce(new Error('Network down'));

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'Network down',
    });
  });

  it('returns success when deals are fetched, mapped, and indexed', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    const mockDeals = [{ gameID: '1', title: 'Game 1', salePrice: '9.99' }];
    mockFetchCheapSharkDeals.mockResolvedValueOnce(mockDeals);
    mockMapDealsToTypesenseGames.mockReturnValueOnce([{ gameID: '1', title: 'Game 1' }]);
    mockIndexGamesBatch.mockResolvedValueOnce(true);

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({ success: true, indexed: 1 });
    expect(mockMapDealsToTypesenseGames).toHaveBeenCalledWith(mockDeals);
    expect(mockIndexGamesBatch).toHaveBeenCalledWith([{ gameID: '1', title: 'Game 1' }]);
  });

  it('returns success:false when indexGamesBatch returns false', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockResolvedValueOnce([{ gameID: '1' }]);
    mockMapDealsToTypesenseGames.mockReturnValueOnce([{ gameID: '1' }]);
    mockIndexGamesBatch.mockResolvedValueOnce(false);

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result.success).toBe(false);
    expect(result.indexed).toBe(1);
  });

  it('returns error when mapDealsToTypesenseGames throws', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockResolvedValueOnce([{ gameID: '1' }]);
    mockMapDealsToTypesenseGames.mockImplementationOnce(() => {
      throw new Error('Mapping failed');
    });

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'Mapping failed',
    });
  });

  it('returns error when indexGamesBatch throws', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockResolvedValueOnce([{ gameID: '1' }]);
    mockMapDealsToTypesenseGames.mockReturnValueOnce([{ gameID: '1' }]);
    mockIndexGamesBatch.mockRejectedValueOnce(new Error('Index failed'));

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'Index failed',
    });
  });

  it('returns "Unknown error" for non-Error thrown values from mapDeals', async () => {
    process.env.TYPESENSE_ADMIN_KEY = 'test-key';
    mockFetchCheapSharkDeals.mockResolvedValueOnce([{ gameID: '1' }]);
    mockMapDealsToTypesenseGames.mockImplementationOnce(() => {
      throw 'string error';
    });

    const { syncGamesToTypesenseAction } = await importModule();
    const result = await syncGamesToTypesenseAction();
    expect(result).toEqual({
      success: false,
      indexed: 0,
      error: 'Unknown error',
    });
  });
});
