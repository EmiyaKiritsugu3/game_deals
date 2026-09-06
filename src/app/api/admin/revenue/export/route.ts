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
  const rows = (await db.execute(sql`
    SELECT
      ac."storeId" AS store_id,
      count(*)::int AS clicks,
      count(DISTINCT conv.id)::int AS conversions,
      COALESCE(sum(CASE WHEN conv.status IN ('approved', 'paid') THEN conv."commissionCents" ELSE 0 END), 0)::int AS revenue_cents
    FROM affiliate_clicks ac
    LEFT JOIN affiliate_conversions conv ON conv."clickId" = ac.id
    ${where}
    GROUP BY ac."storeId"
    ORDER BY ac."storeId"
  `)) as unknown as StoreRevenueRow[];

  return new Response(toStoreCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="revenue-${period}.csv"`,
    },
  });
}
