'use server';

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });

/**
 * Criar price alert
 */
export async function createPriceAlertAction(
  userId: string,
  gameId: string,
  targetPrice: number,
  storeId?: string
) {
  const [alert] = await sql`
    INSERT INTO price_alerts ("userId", "gameId", "targetPrice", "storeId", "isActive", "createdAt")
    VALUES (${userId}, ${gameId}, ${targetPrice}, ${storeId || null}, 1, NOW())
    ON CONFLICT ("userId", "gameId") DO UPDATE SET
      "targetPrice" = ${targetPrice},
      "storeId" = ${storeId || null},
      "isActive" = 1
    RETURNING *
  `;
  return alert;
}

/**
 * Buscar alerts do usuário
 */
export async function getUserAlertsAction(userId: string) {
  return sql`
    SELECT pa.*, g.title, g."thumbUrl"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."userId" = ${userId} AND pa."isActive" = 1
    ORDER BY pa."createdAt" DESC
  `;
}

/**
 * Deletar alert
 */
export async function deletePriceAlertAction(alertId: string) {
  await sql`DELETE FROM price_alerts WHERE id = ${alertId}`;
  return true;
}

/**
 * Checar alerts que atingiram o preço alvo
 * Chamado pelo cron job
 */
export async function checkTriggeredAlertsAction() {
  const triggered = await sql`
    SELECT pa.*, g.title, g."thumbUrl",
           (SELECT MIN(price) FROM deals WHERE "gameId" = pa."gameId") AS "currentLowest"
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    WHERE pa."isActive" = 1
  `;

  const alertsToNotify = triggered.filter((alert: any) => {
    const currentLowest = parseFloat(alert.currentLowest || '999');
    return currentLowest <= alert.targetPrice;
  });

  return alertsToNotify;
}
