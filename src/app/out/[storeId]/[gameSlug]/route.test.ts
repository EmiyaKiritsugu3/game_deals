import { beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics/server', () => ({ track }));

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock('@/db', () => ({ db: { execute } }));

import { GET } from './route';

describe('GET /out/[storeId]/[gameSlug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    track.mockResolvedValue(undefined);
  });

  it('tracks affiliate click on valid redirect', async () => {
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    const response = await GET(new Request('http://localhost:3000/out/11/awesome-game'), {
      params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }),
    });

    expect(track).toHaveBeenCalledWith(
      'affiliate_click',
      expect.objectContaining({
        store_id: '11',
        game_slug: 'awesome-game',
      })
    );
    expect(response.status).toBe(302);
  });

  it('does not track on invalid store id', async () => {
    await expect(() =>
      GET(new Request('http://localhost:3000/out/999/game'), {
        params: Promise.resolve({ storeId: '999', gameSlug: 'game' }),
      })
    ).rejects.toThrow();

    expect(track).not.toHaveBeenCalled();
  });

  it('does not track on invalid game slug', async () => {
    await expect(() =>
      GET(new Request('http://localhost:3000/out/11/!nv@lid'), {
        params: Promise.resolve({ storeId: '11', gameSlug: '!nv@lid' }),
      })
    ).rejects.toThrow();

    expect(track).not.toHaveBeenCalled();
  });

  it('does not block redirect on track failure', async () => {
    track.mockRejectedValueOnce(new Error('Analytics error'));
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    const response = await GET(new Request('http://localhost:3000/out/11/awesome-game'), {
      params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }),
    });

    expect(track).toHaveBeenCalled();
    expect(response.status).toBe(302);
  });

  it('logs error when affiliate click insert fails (L3)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    execute
      .mockResolvedValueOnce([
        { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
      ])
      .mockRejectedValueOnce(new Error('DB insert failed'));

    const response = await GET(new Request('http://localhost:3000/out/11/awesome-game'), {
      params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }),
    });

    expect(response.status).toBe(302);
    // Allow async console.error to fire
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith('affiliate_click insert failed:', expect.any(Error));
    spy.mockRestore();
  });
});

function extractIpFromExecute(): string | undefined {
  for (const call of execute.mock.calls) {
    const query = call[0];
    if (query && typeof query === 'object' && 'queryChunks' in query) {
      const chunks: unknown[] = (query as { queryChunks: unknown[] }).queryChunks;
      const hasInsert = chunks.some(
        (c: unknown) =>
          typeof c === 'object' &&
          c !== null &&
          'value' in c &&
          Array.isArray((c as { value: unknown[] }).value) &&
          (c as { value: string[] }).value[0]?.includes?.('INSERT INTO affiliate_clicks')
      );
      if (hasInsert) {
        const stringValues = chunks.filter((c: unknown): c is string => typeof c === 'string');
        // INSERT ... VALUES (${clickId}::uuid, ${storeId}, ${gameSlug}, ${ip}, NOW())
        // IP always has a dot, colon, or equals 'unknown' — storeId is plain digits 1-3 chars.
        const ipCandidate = stringValues.find(
          (s) =>
            s === 'unknown' ||
            /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s) ||
            (s.includes(':') && /^[0-9a-f:]+$/i.test(s))
        );
        if (ipCandidate) return ipCandidate;
      }
    }
  }
  return undefined;
}

describe('IP extraction (anti-spoofing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    track.mockResolvedValue(undefined);
  });

  it('prefers x-real-ip over x-forwarded-for', async () => {
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    await GET(
      new Request('http://localhost:3000/out/11/awesome-game', {
        headers: {
          'x-real-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8, 9.10.11.12',
        },
      }),
      { params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }) }
    );

    const ip = extractIpFromExecute();
    expect(ip).toBe('1.2.3.4');
  });

  it('falls back to first x-forwarded-for when x-real-ip absent', async () => {
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    await GET(
      new Request('http://localhost:3000/out/11/awesome-game', {
        headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
      }),
      { params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }) }
    );

    const ip = extractIpFromExecute();
    expect(ip).toBe('10.0.0.1');
  });

  it('returns unknown when no IP headers present', async () => {
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    await GET(new Request('http://localhost:3000/out/11/awesome-game'), {
      params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }),
    });

    const ip = extractIpFromExecute();
    expect(ip).toBe('unknown');
  });

  it('passes IPv6 from x-real-ip through unchanged', async () => {
    execute.mockResolvedValue([
      { url: 'https://www.humblebundle.com/store/awesome-game', storeId: '11' },
    ]);

    await GET(
      new Request('http://localhost:3000/out/11/awesome-game', {
        headers: { 'x-real-ip': '::1' },
      }),
      { params: Promise.resolve({ storeId: '11', gameSlug: 'awesome-game' }) }
    );

    const ip = extractIpFromExecute();
    expect(ip).toBe('::1');
  });
});
