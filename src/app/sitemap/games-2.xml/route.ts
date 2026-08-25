import { sql } from 'drizzle-orm';
import { type SitemapEntry, sitemapXmlResponse } from '@/app/sitemap/_lib/serialize';
import { db } from '@/db';

const SITE_URL = 'https://gamedeals.com.br';
const CHUNK_SIZE = 10_000;

async function loadChunk(offset: number): Promise<SitemapEntry[]> {
  let games: { cheapsharkId: string }[] = [];
  try {
    const result = await db.execute<{ cheapsharkId: string }>(
      sql`SELECT "cheapsharkId" FROM games ORDER BY "cheapsharkId" OFFSET ${offset} LIMIT ${CHUNK_SIZE}`
    );
    games = result as { cheapsharkId: string }[];
  } catch {
    return [];
  }
  const now = new Date();
  return games.map((g) => ({
    url: `${SITE_URL}/game/${g.cheapsharkId}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}

export async function GET(): Promise<Response> {
  return sitemapXmlResponse(await loadChunk(20000));
}
