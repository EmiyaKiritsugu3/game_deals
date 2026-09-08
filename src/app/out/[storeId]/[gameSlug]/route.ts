import { randomUUID } from 'node:crypto';
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

const CLICK_TRACKING_PARAM = 'gamedeals_click';

function getClientIp(request: Request): string {
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return 'unknown';
}

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
  return (
    ALLOWED_DOMAINS.has(url.hostname) && (url.protocol === 'http:' || url.protocol === 'https:')
  );
}

function applyAffiliateParams(url: string, storeId: string, clickId: string): string {
  const config = affiliateConfig[storeId];
  if (!config) return url;

  const parsedUrl = new URL(url || config.baseUrl);

  if (!isDomainAllowed(parsedUrl)) {
    console.warn(`Blocked redirect to non-allowlisted domain: ${parsedUrl.hostname}`);
    return '';
  }

  // Read params at click time so env-driven IDs take effect without redeploy.
  const params = config.params();
  for (const [key, value] of Object.entries(params)) {
    if (value) parsedUrl.searchParams.append(key, value);
  }

  // Correlation key: networks that echo this back let postback join click→conversion.
  parsedUrl.searchParams.append(CLICK_TRACKING_PARAM, clickId);

  const finalUrl = parsedUrl.toString();
  const finalParsed = new URL(finalUrl);
  if (!isDomainAllowed(finalParsed)) {
    console.warn(
      `Blocked redirect to non-allowlisted domain after param append: ${finalParsed.hostname}`
    );
    return '';
  }
  return finalUrl;
}

function logClick(clickId: string, storeId: string, gameSlug: string, ip: string): void {
  // Ponytail: fire-and-forget. Redirect must not wait on DB write.
  db.execute(sql`
    INSERT INTO affiliate_clicks (id, "storeId", "gameSlug", ip, "timestamp")
    VALUES (${clickId}::uuid, ${storeId}, ${gameSlug}, ${ip}, NOW())
  `).catch((err) => {
    console.error('affiliate_click insert failed:', err);
  });
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
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  const clickId = randomUUID();

  let targetUrl = await lookupDealUrl(storeId);
  targetUrl = applyAffiliateParams(targetUrl, storeId, clickId);

  if (targetUrl) {
    const ip = getClientIp(request);
    logClick(clickId, storeId, gameSlug, ip);

    track('affiliate_click', { store_id: storeId, game_slug: gameSlug }).catch(() => {});

    return NextResponse.redirect(targetUrl, 302);
  }

  return NextResponse.redirect(new URL('/', request.url), 302);
}
