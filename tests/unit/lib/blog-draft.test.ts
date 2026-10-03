import { describe, expect, it, vi } from 'vitest';
import {
  bodyWords,
  buildDraftMarkdown,
  DRAFT_MIN_DEALS,
  DRAFT_MIN_WORDS,
  type DraftDeal,
  draftSlug,
  toDraftDeals,
} from '@/lib/blog-draft';

const mk = (i: number): DraftDeal => ({
  title: `Game ${i}`,
  salePrice: 0,
  normalPrice: 59.99,
  savings: 100,
  store: 'Steam',
  gameID: `${i}`,
});

const rawDeal = (over: Record<string, string> = {}) => ({
  internalName: 'x',
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
  ...over,
});

describe('toDraftDeals', () => {
  it('keeps free deals with store names', () => {
    const out = toDraftDeals([rawDeal(), rawDeal({ salePrice: '5', gameID: '7' })], {
      '1': 'Steam',
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: 'Free Game', store: 'Steam', gameID: '612' });
  });

  it('falls back to Loja <id> for unknown store', () => {
    const out = toDraftDeals([rawDeal({ storeID: '99' })], {});
    expect(out[0].store).toBe('Loja 99');
  });
});

describe('draftSlug', () => {
  it('date-based', () => {
    expect(draftSlug(new Date('2026-09-07T13:00:00Z'))).toBe('jogos-gratis-da-semana-2026-09-07');
  });
});

describe('buildDraftMarkdown', () => {
  it('draft frontmatter: published false + dealIds', () => {
    const md = buildDraftMarkdown([mk(1), mk(2), mk(3)], new Date('2026-09-07T13:00:00Z'));
    expect(md).toContain('published: false');
    expect(md).toContain('dealIds: 1, 2, 3');
    expect(md).toContain('## Game 1');
  });

  it('3 deals clear 600 words', () => {
    const md = buildDraftMarkdown([mk(1), mk(2), mk(3)], new Date('2026-09-07T13:00:00Z'));
    expect(bodyWords(md)).toBeGreaterThanOrEqual(DRAFT_MIN_WORDS);
  });

  it('8 deals also clear it', () => {
    const md = buildDraftMarkdown([1, 2, 3, 4, 5, 6, 7, 8].map(mk), new Date());
    expect(bodyWords(md)).toBeGreaterThanOrEqual(DRAFT_MIN_WORDS);
  });

  it('bodyWords 0 on garbage', () => {
    expect(bodyWords('no frontmatter')).toBe(0);
  });

  it('gates constants match spec', () => {
    expect(DRAFT_MIN_DEALS).toBe(3);
  });
});

describe('uniqueSlug + saveDraft', () => {
  it('first free slug wins, else suffix', async () => {
    const { promises: fs } = await import('node:fs');
    const spy = vi.spyOn(fs, 'readFile');
    spy.mockRejectedValueOnce(new Error('ENOENT'));
    const { uniqueSlug } = await import('@/lib/blog-draft');
    await expect(uniqueSlug('jogos-gratis-da-semana-2026-09-07')).resolves.toBe(
      'jogos-gratis-da-semana-2026-09-07'
    );
    spy.mockRestore();
  });

  it('saveDraft writes file', async () => {
    const { promises: fs } = await import('node:fs');
    const mkdir = vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const write = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const { saveDraft } = await import('@/lib/blog-draft');
    await saveDraft('x', 'md');
    expect(mkdir).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    mkdir.mockRestore();
    write.mockRestore();
  });
});
