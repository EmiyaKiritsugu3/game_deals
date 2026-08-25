import { type SitemapEntry, sitemapXmlResponse } from '@/app/sitemap/_lib/serialize';

const SITE_URL = 'https://gamedeals.com.br';

export function GET(): Response {
  const now = new Date();
  const collections = ['top-deals', 'under-10', 'free-games', 'new-releases'];
  const stores = [
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
  ];
  const genres = ['aaa', 'altamente-avaliados', 'indie', 'rpg'];

  const entries: SitemapEntry[] = [
    ...collections.map((slug) => ({
      url: `${SITE_URL}/collections/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...stores.map((slug) => ({
      url: `${SITE_URL}/deals/by-store/${slug}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    })),
    ...genres.map((slug) => ({
      url: `${SITE_URL}/deals/by-genre/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
  return sitemapXmlResponse(entries);
}
