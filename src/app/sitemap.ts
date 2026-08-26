import { sql } from 'drizzle-orm';
import type { MetadataRoute } from 'next';
import { db } from '@/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';
const GAMES_CHUNK = 10_000;

/**
 * Sitemaps via native generateSitemaps() — replaces the previous 7 custom
 * route handlers. URLs become /sitemap/<id>.xml served by Next itself.
 */
export async function generateSitemaps() {
  // 5 fixed chunks cover up to 50k games (Google limit per sitemap).
  return [
    { id: 'static' },
    { id: 'collections' },
    { id: 'deals' },
    ...[0, 1, 2, 3, 4].map((n) => ({ id: `games-${n}` })),
  ];
}

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
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
    { url: `${SITE_URL}/deals`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/premium`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}

const COLLECTION_SLUGS = ['top-deals', 'under-10', 'free-games', 'new-releases'];
const STORE_SLUGS = [
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
const GENRE_SLUGS = ['aaa', 'altamente-avaliados', 'indie', 'rpg'];

function collectionEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...COLLECTION_SLUGS.map((slug) => ({
      url: `${SITE_URL}/collections/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...STORE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/deals/by-store/${slug}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    })),
    ...GENRE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/deals/by-genre/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}

function dealEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return ['under-10', 'under-20', 'under-30'].map((slug) => ({
    url: `${SITE_URL}/deals/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}

async function loadGameChunk(chunk: number): Promise<MetadataRoute.Sitemap> {
  try {
    const result = await db.execute<{ cheapsharkId: string }>(
      sql`SELECT "cheapsharkId" FROM games ORDER BY "cheapsharkId" OFFSET ${chunk * GAMES_CHUNK} LIMIT ${GAMES_CHUNK}`
    );
    const rows = result as unknown as { cheapsharkId: string }[];
    const now = new Date();
    return rows.map((g) => ({
      url: `${SITE_URL}/game/${g.cheapsharkId}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    return []; // DB down → empty chunk beats a broken sitemap
  }
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  switch (id) {
    case 'static':
      return staticEntries();
    case 'collections':
      return collectionEntries();
    case 'deals':
      return dealEntries();
    default: {
      const m = /^games-(\d)$/.exec(id);
      if (!m) return [];
      return loadGameChunk(Number(m[1]));
    }
  }
}
