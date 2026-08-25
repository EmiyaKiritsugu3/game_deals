import { type SitemapEntry, sitemapXmlResponse } from '@/app/sitemap/_lib/serialize';

const SITE_URL = 'https://gamedeals.com.br';

export function GET(): Response {
  const now = new Date();
  const entries: SitemapEntry[] = ['under-10', 'under-20', 'under-30'].map((slug) => ({
    url: `${SITE_URL}/deals/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
  return sitemapXmlResponse(entries);
}
