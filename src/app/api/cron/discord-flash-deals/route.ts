import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { postDiscordEmbed } from '@/lib/discord-webhook';
import { handleCronError } from '../_lib/errors';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';

interface FlashDealRow {
  [key: string]: unknown;
  dealId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
}

/**
 * Cron: Discord flash-deal posts (Task 4.1).
 * Top 3 deals >=70% off, deduped via social_posts table.
 * vercel.json schedule: every-15-minutes.
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const result = await db.execute<FlashDealRow>(sql`
      SELECT d."dealID" AS "dealId", g."title" AS title,
             d."salePrice"::float AS "salePrice",
             d."normalPrice"::float AS "normalPrice",
             ROUND((1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100)::int AS savings,
             COALESCE(g."thumb", '') AS thumb
      FROM deals d
      JOIN games g ON g."cheapsharkId" = d."gameID"
      WHERE d."salePrice" > 0
        AND (1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100 >= 70
        AND NOT EXISTS (
          SELECT 1 FROM social_posts sp
          WHERE sp.channel = 'discord' AND sp."deal_id" = d."dealID"
        )
      ORDER BY savings DESC
      LIMIT 3
    `);

    const rows = result as unknown as FlashDealRow[];
    let posted = 0;

    for (const row of rows) {
      // Claim first — unique index prevents double-post across concurrent runs.
      const claimed = await db
        .insert(socialPosts)
        .values({ channel: 'discord', dealId: row.dealId })
        .onConflictDoNothing()
        .returning({ id: socialPosts.id });

      if (claimed.length === 0) continue; // lost race / already posted

      const ok = await postDiscordEmbed({
        title: `🔥 ${row.title} — ${Math.round(row.savings)}% OFF`,
        url: `${SITE_URL}/game/${row.dealId}`,
        description: `De R$ ${row.normalPrice.toFixed(2)} por R$ ${row.salePrice.toFixed(2)}`,
        color: 0x22d3ee,
        image: row.thumb ? { url: row.thumb } : undefined,
      });

      if (!ok) {
        // Release claim so next run can retry.
        await db.delete(socialPosts).where(eq(socialPosts.id, claimed[0]?.id ?? ''));
      } else {
        posted++;
      }
    }

    cronLog({ cron: 'discord-flash-deals', event: 'posted', count: posted });
    return Response.json({ ok: true, posted, candidates: rows.length });
  } catch (err) {
    cronError({ cron: 'discord-flash-deals' }, err);
    return handleCronError(err);
  }
}
