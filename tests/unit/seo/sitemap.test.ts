import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('includes game detail pages with correct sitemap format', async () => {
    const result = await sitemap();

    const gameEntries = result.filter((entry) =>
      entry.url.includes('/game/')
    );

    expect(gameEntries.length).toBeGreaterThan(0);
    for (const entry of gameEntries) {
      expect(entry.lastModified).toBeDefined();
      expect(entry.changeFrequency).toBe('weekly');
      expect(entry.priority).toBe(0.7);
    }
  });
});
