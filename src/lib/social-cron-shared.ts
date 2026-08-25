import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';

/**
 * Shared deal-candidate query + claim/release for the 3 social crons
 * (discord/pinterest/x). Extracted to satisfy SonarCloud duplication gate —
 * the three routes differed only in channel, threshold and limit.
 */

export interface SocialDealRow {
  [key: string]: unknown;
  dealId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
}

export async function loadCandidates(
  minSavings: number,
  limit: number,
  channel: string
): Promise<SocialDealRow[]> {
  const result = await db.execute<SocialDealRow>(sql`
    SELECT d."dealID" AS "dealId", g."title" AS title,
           d."salePrice"::float AS "salePrice",
           d."normalPrice"::float AS "normalPrice",
           ROUND((1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100)::int AS savings,
           COALESCE(g."thumb", '') AS thumb
    FROM deals d
    JOIN games g ON g."cheapsharkId" = d."gameID"
    WHERE d."salePrice" > 0
      AND (1 - d."salePrice" / NULLIF(d."normalPrice", 0)) * 100 >= ${minSavings}
      AND NOT EXISTS (
        SELECT 1 FROM social_posts sp
        WHERE sp.channel = ${channel} AND sp."deal_id" = d."dealID"
      )
    ORDER BY savings DESC
    LIMIT ${limit}
  `);
  return result as unknown as SocialDealRow[];
}

/** Claim (dealId, channel). Returns release() on success, null if already claimed. */
export async function claimDeal(
  channel: string,
  dealId: string
): Promise<(() => Promise<void>) | null> {
  const claimed = await db
    .insert(socialPosts)
    .values({ channel, dealId })
    .onConflictDoNothing()
    .returning({ id: socialPosts.id });
  const rowId = claimed[0]?.id;
  if (!rowId) return null;
  return async () => {
    await db.delete(socialPosts).where(sql`id = ${rowId}`);
  };
}
