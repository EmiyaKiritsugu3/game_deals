import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

interface RevenueRow {
  store_id: string;
  day: string;
  clicks: number;
  conversions: number;
  revenue_cents: number;
}

async function loadRevenue(): Promise<RevenueRow[]> {
  const rows = (await db.execute(sql`
    SELECT
      ac."storeId" AS store_id,
      date_trunc('day', ac.timestamp)::date::text AS day,
      count(*)::int AS clicks,
      count(DISTINCT conv.id)::int AS conversions,
      COALESCE(sum(CASE WHEN conv.status IN ('approved', 'paid') THEN conv."commissionCents" ELSE 0 END), 0)::int AS revenue_cents
    FROM affiliate_clicks ac
    LEFT JOIN affiliate_conversions conv ON conv."clickId" = ac.id
    WHERE ac.timestamp > now() - interval '30 days'
    GROUP BY ac."storeId", day
    ORDER BY day DESC, ac."storeId"
  `)) as unknown as RevenueRow[];
  return rows;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function RevenuePage() {
  await requireAdmin();
  const rows = await loadRevenue();

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
      <h1 className="text-2xl font-bold mb-6">Revenue (last 30 days</h1>

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
