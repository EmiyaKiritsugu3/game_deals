import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indexGamesBatch, searchGames } from './typesense';

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

  it('falls back to port 443 when TYPESENSE_PORT is empty', async () => {
    vi.stubEnv('TYPESENSE_PORT', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toContain(':443/');
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });

  it('falls back to https when TYPESENSE_PROTOCOL is empty', async () => {
    vi.stubEnv('TYPESENSE_PROTOCOL', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toMatch(/^https:\/\//);
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });

  it('uses NEXT_PUBLIC key when TYPESENSE_ADMIN_KEY is empty', async () => {
    vi.stubEnv('TYPESENSE_ADMIN_KEY', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const hdrs = new Headers((init as RequestInit).headers);
      expect(hdrs.get('X-TYPESENSE-API-KEY')).toBe('test-search-key');
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });

  it('uses empty string when both API keys are missing', async () => {
    vi.stubEnv('TYPESENSE_ADMIN_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_TYPESENSE_SEARCH_KEY', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const hdrs = new Headers((init as RequestInit).headers);
      expect(hdrs.get('X-TYPESENSE-API-KEY')).toBe('');
      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    });
    await searchGames('test');
  });

  it('returns empty array when response has no hits key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const result = await searchGames('test');
    expect(result).toEqual([]);
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

  it('falls back to localhost when TYPESENSE_HOST is empty', async () => {
    vi.stubEnv('TYPESENSE_HOST', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toContain('localhost');
      return new Response(null, { status: 200 });
    });
    await indexGamesBatch([{ gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' }]);
  });

  it('falls back to port 443 when TYPESENSE_PORT is empty', async () => {
    vi.stubEnv('TYPESENSE_PORT', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toContain(':443/');
      return new Response(null, { status: 200 });
    });
    await indexGamesBatch([{ gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' }]);
  });

  it('falls back to https when TYPESENSE_PROTOCOL is empty', async () => {
    vi.stubEnv('TYPESENSE_PROTOCOL', '');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      expect(url.toString()).toMatch(/^https:\/\//);
      return new Response(null, { status: 200 });
    });
    await indexGamesBatch([{ gameID: '1', title: 'Game', thumb: '', cheapest: '9.99' }]);
  });
});
