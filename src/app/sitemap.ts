import { sql } from 'drizzle-orm';
import type { MetadataRoute } from 'next';
import { db } from '@/db';

const SITE_URL = 'https://gamedeals.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/bundles`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  const collections = ['top-deals', 'under-10', 'free-games', 'new-releases'];
  const collectionPages = collections.map((slug) => ({
    url: `${SITE_URL}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const games = await db.execute<{ cheapsharkId: string }>(sql`SELECT "cheapsharkId" FROM games`);
  const gameEntries = (games as { cheapsharkId: string }[]).map((game) => ({
    url: `${SITE_URL}/game/${game.cheapsharkId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...collectionPages, ...gameEntries];
}
