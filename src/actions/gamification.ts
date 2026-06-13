'use server';

import { sql } from 'drizzle-orm';
import { db } from '@/db';

/**
 * Adicionar XP ao usuário
 */
export async function addXPAction(userId: string, amount: number, reason: string) {
  await db.execute(sql`
    INSERT INTO profiles (id, xp, "createdAt")
    VALUES (${userId}, ${amount}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      xp = profiles.xp + ${amount}
  `);

  await db.execute(sql`
    INSERT INTO activities ("userId", "actionType", details, "createdAt")
    VALUES (${userId}, ${reason}, ${JSON.stringify({ xp: amount })}, NOW())
  `);

  return true;
}

/**
 * Buscar XP do usuário
 */
export async function getUserXPAction(userId: string) {
  const rows = (await db.execute(sql`
    SELECT xp FROM profiles WHERE id = ${userId}
  `)) as unknown as Array<{ xp: number }>;
  return rows[0]?.xp || 0;
}

/**
 * Buscar badges disponíveis
 */
export async function getBadgesAction() {
  return db.execute(sql`SELECT * FROM badges ORDER BY name`);
}

/**
 * Buscar badges do usuário
 */
export async function getUserBadgesAction(userId: string) {
  return db.execute(sql`
    SELECT b.*, ub."awardedAt"
    FROM user_badges ub
    JOIN badges b ON b.id = ub."badgeId"
    WHERE ub."userId" = ${userId}
    ORDER BY ub."awardedAt" DESC
  `);
}

/**
 * Conceder badge ao usuário
 */
export async function awardBadgeAction(userId: string, badgeId: string) {
  const result = await db.execute(sql`
    INSERT INTO user_badges ("userId", "badgeId", "awardedAt")
    VALUES (${userId}, ${badgeId}, NOW())
    ON CONFLICT ("userId", "badgeId") DO NOTHING
    RETURNING id
  `);
  return (result as unknown as Array<{ id: string }>).length > 0;
}

/**
 * Verificar e conceder badges automáticos
 */
export async function checkAndAwardBadgesAction(userId: string) {
  const xp = await getUserXPAction(userId);
  const wishlistRows = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*) AS count FROM wishlists WHERE "userId" = ${userId}
  `);
  const playlistRows = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*) AS count FROM playlists WHERE "userId" = ${userId}
  `);

  const wishlistCount = wishlistRows[0]?.count ?? 0;
  const playlistCount = playlistRows[0]?.count ?? 0;

  if (xp > 0) {
    const badge = (await db.execute(
      sql`SELECT id FROM badges WHERE name = 'First Steps'`
    )) as unknown as Array<{ id: string }>;
    if (badge[0]) await awardBadgeAction(userId, badge[0].id);
  }

  if (xp >= 100) {
    const badge = (await db.execute(
      sql`SELECT id FROM badges WHERE name = 'XP Hunter'`
    )) as unknown as Array<{ id: string }>;
    if (badge[0]) await awardBadgeAction(userId, badge[0].id);
  }

  if (wishlistCount >= 10) {
    const badge = (await db.execute(
      sql`SELECT id FROM badges WHERE name = 'Wishlist Master'`
    )) as unknown as Array<{ id: string }>;
    if (badge[0]) await awardBadgeAction(userId, badge[0].id);
  }

  if (playlistCount >= 5) {
    const badge = (await db.execute(
      sql`SELECT id FROM badges WHERE name = 'Curator'`
    )) as unknown as Array<{ id: string }>;
    if (badge[0]) await awardBadgeAction(userId, badge[0].id);
  }

  return true;
}
