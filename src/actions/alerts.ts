'use server';

import { sql } from 'drizzle-orm';
import { resolveGameUuid } from '@/actions/deals';
import { db } from '@/db';
import { createClient } from '@/utils/supabase/server';

// fallow-ignore-next-line complexity
// fallow-ignore-next-line unused-export
export async function createPriceAlertAction(
  gameId: string,
  targetPrice: number,
  storeId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

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
  return (inserted as unknown as Array<Record<string, unknown>>)[0];
}

// fallow-ignore-next-line unused-export
export async function getUserAlertsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return db.execute(sql`
    SELECT pa.*, g.title, g."thumbUrl"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."userId" = ${user.id}::uuid AND pa."isActive" = 1
    ORDER BY pa."createdAt" DESC
  `);
}

// fallow-ignore-next-line unused-export
export async function deletePriceAlertAction(alertId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const rows = await db.execute(sql`SELECT "userId" FROM price_alerts WHERE id = ${alertId}::uuid`);
  const alert = (rows as unknown as Array<{ userId: string }>)[0];
  if (!alert || alert.userId !== user.id) throw new Error('Forbidden');

  await db.execute(sql`DELETE FROM price_alerts WHERE id = ${alertId}::uuid`);
  return true;
}

export async function checkTriggeredAlertsAction(): Promise<{
  checked: number;
  triggered: Array<Record<string, unknown>>;
}> {
  const alerts = await db.execute(sql`
    SELECT pa.*, g.title, g."thumbUrl",
           (SELECT MIN(d.price) FROM deals d
            WHERE d."gameId" = pa."gameId"
              AND (pa."storeId" IS NULL OR d."storeId" = pa."storeId")
           ) AS "currentLowest"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."isActive" = 1
  `);

  const alertsArray = alerts as unknown as Array<Record<string, unknown>>;
  const triggered = alertsArray.filter((alert): boolean => {
    const raw = alert.currentLowest;
    const currentLowest =
      raw == null
        ? Number.POSITIVE_INFINITY
        : Number.parseFloat(typeof raw === 'string' ? raw : String(raw));
    return currentLowest <= Number(alert.targetPrice ?? 0);
  });

  return {
    checked: alertsArray.length,
    triggered,
  };
}
