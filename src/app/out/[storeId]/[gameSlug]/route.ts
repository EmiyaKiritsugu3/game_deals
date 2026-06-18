import { track } from '@vercel/analytics/server';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  ALLOWED_DOMAINS,
  affiliateConfig,
  isValidGameSlug,
  isValidStoreId,
} from '@/lib/affiliate-config';

async function lookupDealUrl(storeId: string): Promise<string> {
  try {
    const [deal] = (await db.execute(sql`
      SELECT url, "storeId" FROM deals
      WHERE "storeId" = ${storeId}
      LIMIT 1
    `)) as unknown as Array<{ url: string | null; storeId: string }>;

    return deal?.url ?? '';
  } catch {
    console.error('Deal lookup error');
    return '';
  }
}

function isDomainAllowed(url: URL): boolean {
  return ALLOWED_DOMAINS.has(url.hostname);
}

function applyAffiliateParams(url: string, storeId: string): string {
  const config = affiliateConfig[storeId];
  if (!config) return url;

  const parsedUrl = new URL(url || config.baseUrl);

  if (!isDomainAllowed(parsedUrl)) {
    console.warn(`Blocked redirect to non-allowlisted domain: ${parsedUrl.hostname}`);
    return '';
  }

  Object.entries(config.params).forEach(([key, value]) => {
    parsedUrl.searchParams.append(key, value);
  });

  return parsedUrl.toString();
}

function logClick(storeId: string, gameSlug: string, ip: string): void {
  db.execute(sql`
    INSERT INTO affiliate_clicks ("storeId", "gameSlug", ip, "timestamp")
    VALUES (${storeId}, ${gameSlug}, ${ip}, NOW())
  `).catch(() => {});
}

/**
 * GET /out/[storeId]/[gameSlug]
 * Redirect to deal with affiliate tracking.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string; gameSlug: string }> }
) {
  const { storeId, gameSlug } = await params;

  if (!isValidStoreId(storeId) || !isValidGameSlug(gameSlug)) {
    return NextResponse.redirect('/', 302);
  }

  let targetUrl = await lookupDealUrl(storeId);
  targetUrl = applyAffiliateParams(targetUrl, storeId);

  if (targetUrl) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    logClick(storeId, gameSlug, ip);

    track('affiliate_click', { store_id: storeId, game_slug: gameSlug }).catch(() => {});

    return NextResponse.redirect(targetUrl, 302);
  }

  return NextResponse.redirect('/', 302);
}
