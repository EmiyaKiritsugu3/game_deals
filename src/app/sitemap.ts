import type { MetadataRoute } from 'next';

const SITE_URL = 'https://gamedeals.com.br';

/**
 * Sitemap index — splits sitemap.xml into child sitemaps for crawler-friendly chunks.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/sitemap/static.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/collections.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/deals.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/games-0.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/games-1.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/games-2.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/games-3.xml`, lastModified: now },
    { url: `${SITE_URL}/sitemap/games-4.xml`, lastModified: now },
  ];
}
