import { type SitemapEntry, sitemapXmlResponse } from '@/app/sitemap/_lib/serialize';

const SITE_URL = 'https://gamedeals.com.br';

export function GET(): Response {
  const now = new Date();
  const entries: SitemapEntry[] = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/bundles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${SITE_URL}/playlists`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.5 },
  ];
  return sitemapXmlResponse(entries);
}
