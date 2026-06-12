'use server';

import { config } from 'dotenv';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { createClient } from '@/utils/supabase/server';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });

/**
 * Criar price alert (com auth)
 */
export async function createPriceAlertAction(
  gameId: string,
  targetPrice: number,
  storeId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const [alert] = await sql`
    INSERT INTO price_alerts ("userId", "gameId", "targetPrice", "storeId", "isActive", "createdAt")
    VALUES (${user.id}, ${gameId}, ${targetPrice}, ${storeId || null}, 1, NOW())
    ON CONFLICT ("userId", "gameId") DO UPDATE SET
      "targetPrice" = ${targetPrice},
      "storeId" = ${storeId || null},
      "isActive" = 1
    RETURNING *
  `;
  return alert;
}

/**
 * Buscar alerts do usuário logado
 */
export async function getUserAlertsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return sql`
    SELECT pa.*, g.title, g."thumbUrl"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."userId" = ${user.id} AND pa."isActive" = 1
    ORDER BY pa."createdAt" DESC
  `;
}

/**
 * Deletar alert (com ownership check)
 */
export async function deletePriceAlertAction(alertId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const [alert] = await sql`SELECT "userId" FROM price_alerts WHERE id = ${alertId}`;
  if (!alert || alert.userId !== user.id) throw new Error('Forbidden');

  await sql`DELETE FROM price_alerts WHERE id = ${alertId}`;
  return true;
}

/**
 * Checar alerts que atingiram o preço alvo (loja específica)
 */
export async function checkTriggeredAlertsAction() {
  const triggered = await sql`
    SELECT pa.*, g.title, g."thumbUrl",
           (SELECT MIN(d.price) FROM deals d
            WHERE d."gameId" = pa."gameId"
              AND (pa."storeId" IS NULL OR d."storeId" = pa."storeId")
           ) AS "currentLowest"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."isActive" = 1
  `;

  const alertsToNotify = triggered.filter((alert: any) => {
    const currentLowest = Number.parseFloat(alert.currentLowest || '999');
    return currentLowest <= alert.targetPrice;
  });

  return alertsToNotify;
}
