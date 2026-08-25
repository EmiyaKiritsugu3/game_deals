import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { createTweet } from '@/lib/social-post';
import { handleCronError } from '../_lib/errors';

interface DealRow {
  [key: string]: unknown;
  dealId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
}

/**
 * Cron: X/Twitter daily bot (Task 3.2).
 * Best deal of the day >=50% off, once daily. 15:00 UTC (12h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await db.execute<DealRow>(sql`
      SELECT d."dealID" AS "dealId", g."title" AS title,
             d."salePrice"::float AS "salePrice",
             d."normalPrice"::float AS "normalPrice",
             ROUND((1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100)::int AS savings
      FROM deals d
      JOIN games g ON g."cheapsharkId" = d."gameID"
      WHERE d."salePrice" > 0
        AND (1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100 >= 50
        AND NOT EXISTS (
          SELECT 1 FROM social_posts sp
          WHERE sp.channel = 'x' AND sp."deal_id" = d."dealID"
        )
      ORDER BY savings DESC
      LIMIT 1
    `);

    const rows = result as unknown as DealRow[];
    const row = rows[0];
    if (!row) return Response.json({ ok: true, posted: 0, note: 'no candidate' });

    const claimed = await db
      .insert(socialPosts)
      .values({ channel: 'x', dealId: row.dealId })
      .onConflictDoNothing()
      .returning({ id: socialPosts.id });

    if (claimed.length === 0) {
      return Response.json({ ok: true, posted: 0, note: 'already posted' });
    }

    const ok = await createTweet(row as never);
    if (!ok) {
      await db.delete(socialPosts).where(sql`id = ${claimed[0]?.id}`);
      return Response.json({ ok: false, posted: 0, note: 'post failed' });
    }

    cronLog({ cron: 'twitter-daily', event: 'posted', dealId: row.dealId });
    return Response.json({ ok: true, posted: 1, dealId: row.dealId });
  } catch (err) {
    cronError({ cron: 'twitter-daily' }, err);
    return handleCronError(err);
  }
}
