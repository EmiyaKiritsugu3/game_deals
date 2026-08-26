import { describe, expect, it, vi } from 'vitest';

const execute = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('@/db', () => ({ db: { execute } }));

// Import AFTER mock so the module-level db import resolves to the stub.
const { default: sitemap, generateSitemaps } = await import('@/app/sitemap');

describe('generateSitemaps', () => {
  it('declares 8 sitemap ids (static, collections, deals, games-0..4)', async () => {
    const ids = (await generateSitemaps()).map((s) => s.id);
    expect(ids).toEqual([
      'static',
      'collections',
      'deals',
      'games-0',
      'games-1',
      'games-2',
      'games-3',
      'games-4',
    ]);
  });
});

describe('sitemap(id)', () => {
  const call = async (id: string) => sitemap({ id: Promise.resolve(id) });

  it('static includes home + key routes', async () => {
    const entries = await call('static');
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://gamedeals.com.br');
    expect(urls.some((u) => u.endsWith('/deals'))).toBe(true);
  });

  it('collections lists by-store and by-genre programmatic pages', async () => {
    const entries = await call('collections');
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/deals/by-store/eneba'))).toBe(true);
    expect(urls.some((u) => u.includes('/deals/by-genre/rpg'))).toBe(true);
    expect(urls.some((u) => u.includes('/collections/top-deals'))).toBe(true);
  });

  it('deals lists under-X pages', async () => {
    const urls = (await call('deals')).map((e) => e.url);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain('/deals/under-10');
  });

  it('games chunk maps DB rows to game URLs', async () => {
    execute.mockResolvedValueOnce([{ cheapsharkId: '612' }, { cheapsharkId: '123' }]);
    const entries = await call('games-1');
    expect(entries.map((e) => e.url)).toEqual([
      'https://gamedeals.com.br/game/612',
      'https://gamedeals.com.br/game/123',
    ]);
  });

  it('games chunk returns empty on DB failure (never breaks sitemap)', async () => {
    execute.mockRejectedValueOnce(new Error('db down'));
    await expect(call('games-3')).resolves.toEqual([]);
  });

  it('unknown id yields empty list', async () => {
    await expect(call('bogus')).resolves.toEqual([]);
  });
});
