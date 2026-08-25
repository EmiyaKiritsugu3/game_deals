import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { createPinterestPin } from '@/lib/social-post';
import { handleCronError } from '../_lib/errors';

interface DealRow {
  [key: string]: unknown;
  dealId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
}

/**
 * Cron: Pinterest daily auto-pin (Task 3.1).
 * Top 20 deals >=30% off not yet pinned. Daily 13:00 UTC (10h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await db.execute<DealRow>(sql`
      SELECT d."dealID" AS "dealId", g."title" AS title,
             d."salePrice"::float AS "salePrice",
             d."normalPrice"::float AS "normalPrice",
             ROUND((1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100)::int AS savings,
             COALESCE(g."thumb", '') AS thumb
      FROM deals d
      JOIN games g ON g."cheapsharkId" = d."gameID"
      WHERE d."salePrice" > 0
        AND (1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100 >= 30
        AND NOT EXISTS (
          SELECT 1 FROM social_posts sp
          WHERE sp.channel = 'pinterest' AND sp."deal_id" = d."dealID"
        )
      ORDER BY savings DESC
      LIMIT 20
    `);

    const rows = result as unknown as DealRow[];
    let posted = 0;

    for (const row of rows) {
      const claimed = await db
        .insert(socialPosts)
        .values({ channel: 'pinterest', dealId: row.dealId })
        .onConflictDoNothing()
        .returning({ id: socialPosts.id });
      if (claimed.length === 0) continue;

      const ok = await createPinterestPin({
        dealId: row.dealId,
        title: row.title,
        salePrice: row.salePrice,
        normalPrice: row.normalPrice,
        savings: row.savings,
        thumb: row.thumb,
      });
      if (!ok) {
        await db.delete(socialPosts).where(sql`id = ${claimed[0]?.id}`);
      } else {
        posted++;
      }
    }

    cronLog({ cron: 'pinterest-daily', event: 'posted', count: posted });
    return Response.json({ ok: true, posted, candidates: rows.length });
  } catch (err) {
    cronError({ cron: 'pinterest-daily' }, err);
    return handleCronError(err);
  }
}
