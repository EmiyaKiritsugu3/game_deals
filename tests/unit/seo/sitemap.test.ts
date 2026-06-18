import { describe, expect, it, vi } from 'vitest';

const { mockDbExecute } = vi.hoisted(() => ({
  mockDbExecute: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mockDbExecute,
  },
}));

import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('includes game detail pages with correct sitemap format', async () => {
    mockDbExecute.mockResolvedValue([
      { cheapsharkId: '111' },
      { cheapsharkId: '222' },
      { cheapsharkId: '333' },
    ]);

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
