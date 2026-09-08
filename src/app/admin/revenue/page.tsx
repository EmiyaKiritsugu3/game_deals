import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  parseRevenuePeriod,
  periodDays,
  periodLabel,
  REVENUE_PERIODS,
  type RevenuePeriod,
} from '@/lib/admin-revenue';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

interface RevenueRow {
  store_id: string;
  day: string;
  clicks: number;
  conversions: number;
  revenue_cents: number;
}

async function loadRevenue(period: RevenuePeriod): Promise<RevenueRow[]> {
  const days = periodDays(period);
  // ponytail: daily click rows from clicks table, daily conv sums from
  // conversions table (own storeId, own convertedAt) — LEFT JOIN keeps
  // click-less conversions visible instead of dropping them.
  const where =
    days === null ? sql`` : sql`WHERE ac.timestamp > now() - make_interval(days => ${days})`;
  const whereConv =
    days === null ? sql`` : sql`WHERE c."convertedAt" > now() - make_interval(days => ${days})`;
  const rows = (await db.execute(sql`
    WITH clicks AS (
      SELECT
        ac."storeId" AS store_id,
        date_trunc('day', ac.timestamp)::date::text AS day,
        count(*)::int AS clicks
      FROM affiliate_clicks ac
      ${where}
      GROUP BY ac."storeId", day
    ),
    conv AS (
      SELECT
        c."storeId" AS store_id,
        date_trunc('day', c."convertedAt")::date::text AS day,
        count(*)::int AS conversions,
        COALESCE(sum(CASE WHEN c.status IN ('approved', 'paid') THEN c."commissionCents" ELSE 0 END), 0)::int AS revenue_cents
      FROM affiliate_conversions c
      ${whereConv}
      GROUP BY c."storeId", day
    )
    SELECT
      COALESCE(clicks.store_id, conv.store_id) AS store_id,
      COALESCE(clicks.day, conv.day) AS day,
      COALESCE(clicks.clicks, 0) AS clicks,
      COALESCE(conv.conversions, 0) AS conversions,
      COALESCE(conv.revenue_cents, 0) AS revenue_cents
    FROM clicks
    FULL OUTER JOIN conv
      ON conv.store_id = clicks.store_id AND conv.day = clicks.day
    ORDER BY day DESC, store_id
  `)) as unknown as RevenueRow[];
  return rows;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function RevenuePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  await requireAdmin();
  const params = await searchParams;
  const period = parseRevenuePeriod(typeof params.period === 'string' ? params.period : undefined);
  const rows = await loadRevenue(period);

  const totals = rows.reduce(
    (acc, r) => {
      acc.clicks += r.clicks;
      acc.conversions += r.conversions;
      acc.revenue_cents += r.revenue_cents;
      return acc;
    },
    { clicks: 0, conversions: 0, revenue_cents: 0 }
  );

  const epc = totals.clicks > 0 ? totals.revenue_cents / totals.clicks : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Revenue ({periodLabel(period)})</h1>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="period" className="text-sm text-muted-foreground">
              Period
            </label>
            <select
              id="period"
              name="period"
              defaultValue={period}
              className="rounded-md border bg-background px-3 py-1 text-sm"
            >
              {REVENUE_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All' : p}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted"
            >
              Apply
            </button>
          </form>
          <a
            href={`/api/admin/revenue/export?period=${period}`}
            className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Clicks</div>
          <div className="text-2xl font-semibold">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Conversions</div>
          <div className="text-2xl font-semibold">{totals.conversions.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-2xl font-semibold">{formatCents(totals.revenue_cents)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">EPC</div>
          <div className="text-2xl font-semibold">{formatCents(Math.round(epc))}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No clicks yet. As soon as users start clicking deals, data appears here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Day</th>
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4 text-right">Clicks</th>
                <th className="py-2 pr-4 text-right">Conversions</th>
                <th className="py-2 pr-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.store_id}-${r.day}`} className="border-b">
                  <td className="py-2 pr-4">{r.day}</td>
                  <td className="py-2 pr-4">{r.store_id}</td>
                  <td className="py-2 pr-4 text-right">{r.clicks}</td>
                  <td className="py-2 pr-4 text-right">{r.conversions}</td>
                  <td className="py-2 pr-4 text-right">{formatCents(r.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
