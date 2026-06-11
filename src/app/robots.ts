import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/out/'],
      },
    ],
    sitemap: 'https://gamedeals.com.br/sitemap.xml',
  };
}
