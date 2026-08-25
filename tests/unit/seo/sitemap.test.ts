import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap index', () => {
  it('returns a sitemap index pointing to child sitemaps', () => {
    const result = sitemap();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.url).toMatch(/\.xml$/);
      expect(entry.lastModified).toBeDefined();
    }
  });

  it('includes static, collections, deals, and games chunks', () => {
    const result = sitemap();
    const urls = result.map((e) => e.url);

    expect(urls.some((u) => u.includes('/sitemap/static.xml'))).toBe(true);
    expect(urls.some((u) => u.includes('/sitemap/collections.xml'))).toBe(true);
    expect(urls.some((u) => u.includes('/sitemap/deals.xml'))).toBe(true);
    expect(urls.some((u) => /\/sitemap\/games-\d+\.xml/.test(u))).toBe(true);
  });
});
