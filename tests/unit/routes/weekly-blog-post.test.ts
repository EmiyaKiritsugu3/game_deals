import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDeals, getStores } = vi.hoisted(() => ({ getDeals: vi.fn(), getStores: vi.fn() }));
vi.mock('@/services/api', () => ({ getDeals, getStores }));
vi.mock('@/lib/cron-log', () => ({
  cronError: vi.fn(),
  cronLog: vi.fn(),
}));
const { saveDraft } = vi.hoisted(() => ({ saveDraft: vi.fn() }));
vi.mock('@/lib/blog-draft', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/blog-draft')>();
  return { ...actual, saveDraft };
});
vi.mock('@/lib/blog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/blog')>();
  return {
    ...actual,
    // uniqueSlug loop: first slug taken, suffixed free.
    getPost: vi.fn().mockResolvedValueOnce({ slug: 'taken' }).mockResolvedValue(null),
  };
});

import { GET } from '@/app/api/cron/weekly-blog-post/route';

const CRON_SECRET = 'loop-secret';

function cronRequest(): Request {
  return new Request('http://localhost/api/cron/weekly-blog-post', {
    method: 'GET',
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

const freeDeal = {
  internalName: 'free game',
  title: 'Free Game',
  metacriticLink: '',
  dealID: 'd1',
  storeID: '1',
  gameID: '612',
  salePrice: '0',
  normalPrice: '29.99',
  isOnSale: '1',
  savings: '100',
  metacriticScore: '0',
  steamRatingText: '',
  steamRatingPercent: '0',
  steamRatingCount: '0',
  steamAppID: '0',
  releaseDate: 0,
  lastChange: 0,
  dealRating: '0',
  thumb: 'https://cdn.example/thumbs/612.jpg',
};

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET;
  getDeals.mockReset();
  getStores.mockReset();
  saveDraft.mockClear();
});

describe('GET /api/cron/weekly-blog-post', () => {
  it('rejects request without bearer secret (401)', async () => {
    const res = await GET(new Request('http://localhost/api/cron/weekly-blog-post'));
    expect(res.status).toBe(401);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('returns 500 when CRON_SECRET unset', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(cronRequest());
    expect(res.status).toBe(500);
  });

  it('skips draft when fewer than 3 free deals (no save)', async () => {
    getDeals.mockResolvedValueOnce([freeDeal]);
    getStores.mockResolvedValueOnce({ '1': 'Steam' });
    const res = await GET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { saved: null; note: string };
    expect(body.saved).toBeNull();
    expect(body.note).toContain('need 3');
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('saves draft with unique slug when gate passes', async () => {
    getDeals.mockResolvedValueOnce([
      freeDeal,
      { ...freeDeal, title: 'Free Two', gameID: '123' },
      { ...freeDeal, title: 'Free Three', gameID: '456' },
    ]);
    getStores.mockResolvedValueOnce({ '1': 'Steam' });
    const res = await GET(cronRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { slug: string; deals: number; words: number };
    expect(body.deals).toBe(3);
    expect(body.words).toBeGreaterThanOrEqual(600);
    // First slug taken in mock → suffixed -2.
    expect(body.slug).toMatch(/-2$/);
    expect(saveDraft).toHaveBeenCalledTimes(1);
    const [slug, markdown] = saveDraft.mock.calls[0] as [string, string];
    expect(slug).toBe(body.slug);
    expect(markdown).toContain('published: false');
  });

  it('returns error shape when getDeals throws', async () => {
    getDeals.mockRejectedValueOnce(new Error('cheapshark down'));
    getStores.mockResolvedValueOnce({});
    const res = await GET(cronRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(saveDraft).not.toHaveBeenCalled();
  });
});
