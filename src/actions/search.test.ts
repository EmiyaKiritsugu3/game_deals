import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockTypesenseSearch, mockIndexGamesBatch, mockCaptureException } = vi.hoisted(() => ({
  mockTypesenseSearch: vi.fn(),
  mockIndexGamesBatch: vi.fn(),
  mockCaptureException: vi.fn(),
}));

let originalFetch: typeof globalThis.fetch;

vi.mock('@/lib/typesense', () => ({
  searchGames: mockTypesenseSearch,
  indexGamesBatch: mockIndexGamesBatch,
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}));

beforeEach(() => {
  mockTypesenseSearch.mockReset();
  mockIndexGamesBatch.mockReset();
  mockCaptureException.mockReset();
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
    const mockData = [{ gameID: '123', external: 'Zelda', thumb: '/zelda.jpg', cheapest: '29.99' }];
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
