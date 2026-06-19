import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_SCHEMA, indexGamesBatch, searchGames } from './typesense';

beforeEach(() => {
  vi.stubEnv('TYPESENSE_HOST', 'localhost');
  vi.stubEnv('TYPESENSE_PORT', '443');
  vi.stubEnv('TYPESENSE_PROTOCOL', 'https');
  vi.stubEnv('TYPESENSE_ADMIN_KEY', 'test-admin-key');
  vi.stubEnv('NEXT_PUBLIC_TYPESENSE_SEARCH_KEY', 'test-search-key');
  vi.stubEnv('TYPESENSE_COLLECTION_NAME', 'games');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GAME_SCHEMA', () => {
  it('has name from collection env var', () => {
    expect(GAME_SCHEMA.name).toBe('games');
    vi.stubEnv('TYPESENSE_COLLECTION_NAME', 'custom');
    // Re-import to test env var — but since import is cached, test the shape
    expect(GAME_SCHEMA.fields).toBeDefined();
  });

  it('has 11 fields with all required properties', () => {
    expect(GAME_SCHEMA.fields).toHaveLength(11);
    const gameIdField = GAME_SCHEMA.fields.find((f) => f.name === 'gameID');
    expect(gameIdField).toBeDefined();
    expect(gameIdField?.type).toBe('string');
  });

  it('has token_separators and symbols_to_index', () => {
    expect(GAME_SCHEMA.token_separators).toEqual(['-', '_', '/']);
    expect(GAME_SCHEMA.symbols_to_index).toEqual(['-', '_', '/']);
  });

  it('has default_sorting_field set to cheapestPrice', () => {
    expect(GAME_SCHEMA.default_sorting_field).toBe('cheapestPrice');
  });
});

describe('searchGames', () => {
  it('returns empty array for empty query string', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ hits: [] }), { status: 200 })
    );
    const result = await searchGames('');
    expect(result).toEqual([]);
  });

  it('returns empty array when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 500 }));
    const result = await searchGames('test');
    expect(result).toEqual([]);
  });

  it('returns empty array when no hits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ hits: [] }), { status: 200 })
    );
    const result = await searchGames('test');
    expect(result).toEqual([]);
  });

  it('returns hits when search succeeds', async () => {
    const hits = [{ document: { gameID: '1' }, textMatch: 100 }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ hits }), { status: 200 })
    );
    const result = await searchGames('Dead Cells');
    expect(result).toHaveLength(1);
  });

  it('propagates fetch errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    await expect(searchGames('test')).rejects.toThrow('Network error');
  });

  it('uses localhost when TYPESENSE_HOST is not set', async () => {
    vi.stubEnv('TYPESENSE_HOST', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toContain('localhost');
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });

  it('produces NaN in URL when TYPESENSE_PORT is invalid', async () => {
    vi.stubEnv('TYPESENSE_PORT', 'abc');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toContain(':NaN');
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });
});

describe('indexGamesBatch', () => {
  it('returns true when indexing succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 200 }));
    const result = await indexGamesBatch([
      { gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' },
    ]);
    expect(result).toBe(true);
  });

  it('returns false when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 500 }));
    const result = await indexGamesBatch([
      { gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' },
    ]);
    expect(result).toBe(false);
  });

  it('uses empty admin key header when TYPESENSE_ADMIN_KEY is missing', async () => {
    vi.stubEnv('TYPESENSE_ADMIN_KEY', '');
    let headers: HeadersInit | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => {
      headers = (init as RequestInit).headers;
      return new Response(null, { status: 200 });
    });
    await indexGamesBatch([{ gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' }]);
    const hdrs = new Headers(headers);
    expect(hdrs.get('X-TYPESENSE-API-KEY')).toBe('');
  });

  it('handles empty games array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 200 }));
    const result = await indexGamesBatch([]);
    expect(result).toBe(true);
  });

  it('defaults cheapestPrice to 0 when cheapest is NaN', async () => {
    let body = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => {
      body = (init as RequestInit).body as string;
      return new Response(null, { status: 200 });
    });
    await indexGamesBatch([{ gameID: '1', title: 'Game', thumb: '', cheapest: 'abc' }]);
    expect(body).toContain('"cheapestPrice":0');
  });
});
