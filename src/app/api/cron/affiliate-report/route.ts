import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { postSlackMessage } from '@/lib/slack';
import { handleCronError } from '../_lib/errors';

interface ReportRow {
  [key: string]: unknown;
  clicksToday: number;
  conversions: number;
  commissionCents: number;
}

/**
 * Cron: daily affiliate report to Slack (Task 4.2).
 * Clicks/conversions/commission last 24h. vercel.json: "0 9 * * *".
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await db.execute<ReportRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM affiliate_clicks WHERE "timestamp" >= NOW() - INTERVAL '24 hours')::int AS "clicksToday",
        (SELECT COUNT(*) FROM affiliate_conversions WHERE "convertedAt" >= NOW() - INTERVAL '24 hours')::int AS conversions,
        (SELECT COALESCE(SUM("commissionCents"), 0) FROM affiliate_conversions WHERE "convertedAt" >= NOW() - INTERVAL '24 hours')::int AS "commissionCents"
    `);

    const row = (result as unknown as ReportRow[])[0];
    const clicks = row?.clicksToday ?? 0;
    const conversions = row?.conversions ?? 0;
    const cents = row?.commissionCents ?? 0;

    await postSlackMessage(
      `📊 *Affiliate report* (24h)\n• Clicks: ${clicks}\n• Conversions: ${conversions}\n• Commission: R$ ${(cents / 100).toFixed(2)}`
    );

    cronLog({ cron: 'affiliate-report', event: 'sent', clicks, conversions, cents });
    return Response.json({ ok: true, clicks, conversions, commissionBRL: cents / 100 });
  } catch (err) {
    cronError({ cron: 'affiliate-report' }, err);
    return handleCronError(err);
  }
}
