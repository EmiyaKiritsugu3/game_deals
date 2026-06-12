import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { affiliateConfig, ALLOWED_DOMAINS, isValidStoreId, isValidGameSlug } from '@/lib/affiliate-config';

/**
 * GET /out/[storeId]/[gameSlug]
 * Redireciona pro deal com affiliate tracking
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string; gameSlug: string }> },
) {
  const { storeId, gameSlug } = await params;

  // Validar inputs
  if (!isValidStoreId(storeId) || !isValidGameSlug(gameSlug)) {
    return NextResponse.redirect('/', 302);
  }

  // Buscar deal link do banco ou usar baseUrl da config
  let targetUrl = '';

  try {
    const [deal] = await db.execute(sql`
      SELECT url, "storeId" FROM deals
      WHERE "storeId" = ${storeId}
      LIMIT 1
    `) as unknown as Array<{ url: string | null; storeId: string }>;

    if (deal?.url) {
      targetUrl = deal.url;
    }
  } catch {
    console.error('Deal lookup error');
  }

  // Aplicar affiliate params
  const config = affiliateConfig[storeId];
  if (config) {
    const url = new URL(targetUrl || config.baseUrl);

    // Validar hostname antes de redirecionar
    if (!ALLOWED_DOMAINS.has(url.hostname)) {
      console.warn(`Blocked redirect to non-allowlisted domain: ${url.hostname}`);
      return NextResponse.redirect('/', 302);
    }

    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    targetUrl = url.toString();
  }

  // Log click no banco (fire-and-forget)
  if (targetUrl) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    db.execute(sql`
      INSERT INTO affiliate_clicks ("storeId", "gameSlug", ip, "timestamp")
      VALUES (${storeId}, ${gameSlug}, ${ip}, NOW())
    `).catch(() => {});
  }

  if (targetUrl) {
    return NextResponse.redirect(targetUrl, 302);
  }

  return NextResponse.redirect('/', 302);
}
