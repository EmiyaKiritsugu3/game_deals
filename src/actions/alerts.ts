'use server';

import { sql } from 'drizzle-orm';
import { resolveGameUuid } from '@/actions/deals';
import { db } from '@/db';
import type { PriceAlertWithGame } from '@/types/price-alert';
import { createClient } from '@/utils/supabase/server';

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

// fallow-ignore-next-line unused-export
export async function createPriceAlertAction(
  gameId: string,
  targetPrice: number,
  storeId?: string
) {
  const user = await requireAuth();
  const uuid = await resolveGameUuid(gameId);
  if (!uuid) throw new Error('Game not found or not yet ingested');

  const inserted = await db.execute(sql`
    INSERT INTO price_alerts ("userId", "gameId", "targetPrice", "storeId", "isActive", "createdAt")
    VALUES (${user.id}::uuid, ${uuid}::uuid, ${targetPrice}, ${storeId || null}, 1, NOW())
    ON CONFLICT ("userId", "gameId") DO UPDATE SET
      "targetPrice" = ${targetPrice},
      "storeId" = ${storeId || null},
      "isActive" = 1
    RETURNING *
  `);
  return inserted[0];
}

// fallow-ignore-next-line unused-export
export async function getUserAlertsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const result = await db.execute<PriceAlertWithGame>(sql`
    SELECT pa.*, g.title, g."thumbUrl", g."cheapsharkId" AS cheapshark_id
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."userId" = ${user.id}::uuid AND pa."isActive" = 1
    ORDER BY pa."createdAt" DESC
  `);
  return result;
}

// fallow-ignore-next-line unused-export
export async function deletePriceAlertAction(alertId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const result = await db.execute(
    sql`DELETE FROM price_alerts WHERE id = ${alertId}::uuid AND "userId" = ${user.id}::uuid RETURNING id`
  );
  const rows = result as unknown as Array<{ id: string }>;
  if (rows.length === 0) throw new Error('Forbidden');

  return true;
}

export async function checkTriggeredAlertsAction(): Promise<{
  checked: number;
  triggered: Array<Record<string, unknown>>;
}> {
  const countResult = await db.execute(
    sql`SELECT COUNT(*)::int AS cnt FROM price_alerts WHERE "isActive" = 1`
  );
  const countRow = countResult[0] as { cnt: number } | undefined;
  const checked = Number(countRow?.cnt ?? 0);

  const triggeredRows = await db.execute<Record<string, unknown>>(
    sql`SELECT * FROM public.check_alerts_for_all()`
  );

  const triggered = triggeredRows.map((r) => ({
    userId: r.user_id,
    gameId: r.game_id,
    storeId: r.store_id,
    targetPrice: r.target_price,
    currentLowest: r.current_price,
    notificationId: r.notification_id,
  }));

  return { checked, triggered };
}
