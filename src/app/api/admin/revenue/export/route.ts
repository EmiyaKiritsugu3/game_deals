import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  parseRevenuePeriod,
  periodDays,
  type StoreRevenueRow,
  toStoreCsv,
} from '@/lib/admin-revenue';
import { requireAdmin } from '@/lib/require-admin';
import { ForbiddenError, UnauthorizedError } from '@/lib/require-user';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/revenue/export?period=7d|30d|90d|all
 *
 * CSV of clicks + conversions aggregated by store. Admin only.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    throw err;
  }

  const period = parseRevenuePeriod(new URL(request.url).searchParams.get('period'));
  const days = periodDays(period);

  const where =
    days === null ? sql`` : sql`WHERE ac.timestamp > now() - make_interval(days => ${days})`;
  const whereConv =
    days === null ? sql`` : sql`WHERE c."convertedAt" > now() - make_interval(days => ${days})`;
  // ponytail: two independent per-store aggregates (clicks from clicks table,
  // conversions from conversions table) — FULL OUTER JOIN keeps click-less
  // conversions (postback without matching clickId) and conversion-less stores.
  const rows = (await db.execute(sql`
    WITH clicks AS (
      SELECT ac."storeId" AS store_id, count(*)::int AS clicks
      FROM affiliate_clicks ac
      ${where}
      GROUP BY ac."storeId"
    ),
    conv AS (
      SELECT
        c."storeId" AS store_id,
        count(*)::int AS conversions,
        COALESCE(sum(CASE WHEN c.status IN ('approved', 'paid') THEN c."commissionCents" ELSE 0 END), 0)::int AS revenue_cents
      FROM affiliate_conversions c
      ${whereConv}
      GROUP BY c."storeId"
    )
    SELECT
      COALESCE(clicks.store_id, conv.store_id) AS store_id,
      COALESCE(clicks.clicks, 0) AS clicks,
      COALESCE(conv.conversions, 0) AS conversions,
      COALESCE(conv.revenue_cents, 0) AS revenue_cents
    FROM clicks
    FULL OUTER JOIN conv ON conv.store_id = clicks.store_id
    ORDER BY store_id
  `)) as unknown as StoreRevenueRow[];

  return new Response(toStoreCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="revenue-${period}.csv"`,
    },
  });
}
