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
    execute.mockResolvedValue([{ url: 'https://store.steampowered.com/deal/123', storeId: '1' }]);

    const response = await GET(new Request('http://localhost:3000/out/1/awesome-game'), {
      params: Promise.resolve({ storeId: '1', gameSlug: 'awesome-game' }),
    });

    expect(track).toHaveBeenCalledWith('affiliate_click', {
      store_id: '1',
      game_slug: 'awesome-game',
    });
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
      GET(new Request('http://localhost:3000/out/1/!nv@lid'), {
        params: Promise.resolve({ storeId: '1', gameSlug: '!nv@lid' }),
      })
    ).rejects.toThrow();

    expect(track).not.toHaveBeenCalled();
  });

  it('does not block redirect on track failure', async () => {
    track.mockRejectedValueOnce(new Error('Analytics error'));
    execute.mockResolvedValue([{ url: 'https://store.steampowered.com/deal/123', storeId: '1' }]);

    const response = await GET(new Request('http://localhost:3000/out/1/awesome-game'), {
      params: Promise.resolve({ storeId: '1', gameSlug: 'awesome-game' }),
    });

    expect(track).toHaveBeenCalled();
    expect(response.status).toBe(302);
  });
});
