import type { MetadataRoute } from 'next';

const SITE_URL = 'https://gamedeals.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .8 },
    { url: `${SITE_URL}/bundles`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .7 },
    { url: `${SITE_URL}/collections`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: .7 },
  ];

  // Dynamic collection pages
  const collections = ['top-deals', 'under-10', 'free-games', 'new-releases'];
  const collectionPages = collections.map((slug) => ({
    url: `${SITE_URL}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: .8,
  }));

  return [...staticPages, ...collectionPages];
}
