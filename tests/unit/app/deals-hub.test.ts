import { describe, expect, it } from 'vitest';
import { formatCount, GENRE_HUB, PRICE_HUB, STORE_HUB } from '@/app/deals/hub-config';

describe('formatCount', () => {
  it('zero', () => expect(formatCount(0)).toBe('sem ofertas ativas'));
  it('small', () => expect(formatCount(7)).toBe('7 ofertas'));
  it('thousands 1-decimal', () => expect(formatCount(1500)).toBe('1.5k ofertas'));
  it('ten-thousands int', () => expect(formatCount(12345)).toBe('12k ofertas'));
  it('boundary 1000', () => expect(formatCount(1000)).toBe('1.0k ofertas'));
});

describe('hub constants', () => {
  it('total links 20 (=13+4+3)', () => {
    expect(STORE_HUB).toHaveLength(13);
    expect(GENRE_HUB).toHaveLength(4);
    expect(PRICE_HUB).toHaveLength(3);
    expect(STORE_HUB.length + GENRE_HUB.length + PRICE_HUB.length).toBe(20);
  });

  it('store slugs match sitemap STORE_SLUGS', () => {
    const slugs = new Set(STORE_HUB.map((s) => s.slug));
    for (const must of [
      'humble',
      'fanatical',
      'eneba',
      'cdkeys',
      'kinguin',
      'gamivo',
      'wingamestore',
      'gamebillet',
      'voidu',
      'gamesplanet',
      'indiegala',
      'dlgamer',
      'nuuvem',
    ]) {
      expect(slugs.has(must), `store slug missing: ${must}`).toBe(true);
    }
  });

  it('genre slugs are by-genre set', () => {
    expect(new Set(GENRE_HUB.map((g) => g.slug))).toEqual(
      new Set(['aaa', 'altamente-avaliados', 'indie', 'rpg'])
    );
  });

  it('price slugs are under-X', () => {
    expect(new Set(PRICE_HUB.map((p) => p.slug))).toEqual(
      new Set(['under-10', 'under-20', 'under-30'])
    );
  });

  it('storeIds are all numeric strings', () => {
    for (const s of STORE_HUB) expect(/^\d+$/.test(s.storeId)).toBe(true);
  });
});

describe('hub page metadata', async () => {
  it('exports revalidate=3600 and metadata title', async () => {
    const mod = await import('@/app/deals/page');
    expect(mod.revalidate).toBe(3600);
    const meta = mod.metadata as { title: string };
    expect(meta.title).toContain('Ofertas');
  });
});

describe('sitemap covers hub slugs', async () => {
  const { default: sitemap } = await import('@/app/sitemap');
  it('static includes /deals; collections+deals cover all hub slugs', async () => {
    const coll = await sitemap({ id: Promise.resolve('collections') });
    const deals = await sitemap({ id: Promise.resolve('deals') });
    const stat = await sitemap({ id: Promise.resolve('static') });
    const urls = new Set([...coll, ...deals, ...stat].map((e) => e.url));
    expect([...urls].some((u) => u.endsWith('/deals'))).toBe(true);
    for (const s of STORE_HUB) {
      expect(
        [...urls].some((u) => u.includes(`/deals/by-store/${s.slug}`)),
        `sitemap missing by-store/${s.slug}`
      ).toBe(true);
    }
    for (const g of GENRE_HUB) {
      expect([...urls].some((u) => u.includes(`/deals/by-genre/${g.slug}`))).toBe(true);
    }
    for (const p of PRICE_HUB) {
      expect([...urls].some((u) => u.endsWith(`/deals/${p.slug}`))).toBe(true);
    }
  });
});
