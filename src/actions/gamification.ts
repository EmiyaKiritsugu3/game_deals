'use server';

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });

// XP por ação
const XP_REWARDS = {
  LOGIN_STREAK: 10,
  ADD_TO_WISHLIST: 5,
  CREATE_PLAYLIST: 15,
  SET_PRICE_ALERT: 10,
  FIRST_PURCHASE: 100,
  DAILY_LOGIN: 5,
};

/**
 * Adicionar XP ao usuário
 */
export async function addXPAction(userId: string, amount: number, reason: string) {
  await sql`
    INSERT INTO profiles (id, xp, "createdAt")
    VALUES (${userId}, ${amount}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      xp = profiles.xp + ${amount}
  `;

  // Log atividade
  await sql`
    INSERT INTO activities ("userId", "actionType", details, "createdAt")
    VALUES (${userId}, ${reason}, ${JSON.stringify({ xp: amount })}, NOW())
  `;

  return true;
}

/**
 * Buscar XP do usuário
 */
export async function getUserXPAction(userId: string) {
  const [row] = await sql`
    SELECT xp FROM profiles WHERE id = ${userId}
  `;
  return row?.xp || 0;
}

/**
 * Buscar badges disponíveis
 */
export async function getBadgesAction() {
  return sql`SELECT * FROM badges ORDER BY name`;
}

/**
 * Buscar badges do usuário
 */
export async function getUserBadgesAction(userId: string) {
  return sql`
    SELECT b.*, ub."awardedAt"
    FROM user_badges ub
    JOIN badges b ON b.id = ub."badgeId"
    WHERE ub."userId" = ${userId}
    ORDER BY ub."awardedAt" DESC
  `;
}

/**
 * Conceder badge ao usuário
 */
export async function awardBadgeAction(userId: string, badgeId: string) {
  const [result] = await sql`
    INSERT INTO user_badges ("userId", "badgeId", "awardedAt")
    VALUES (${userId}, ${badgeId}, NOW())
    ON CONFLICT ("userId", "badgeId") DO NOTHING
    RETURNING *
  `;
  return !!result;
}

/**
 * Verificar e conceder badges automáticos
 */
export async function checkAndAwardBadgesAction(userId: string) {
  const xp = await getUserXPAction(userId);
  const wishlistCount = await sql`
    SELECT COUNT(*) AS count FROM wishlists WHERE "userId" = ${userId}
  `;
  const playlistCount = await sql`
    SELECT COUNT(*) AS count FROM playlists WHERE "userId" = ${userId}
  `;

  // Badge: Primeira vez
  if (xp > 0) {
    const [badge] = await sql`SELECT id FROM badges WHERE name = 'First Steps'`;
    if (badge) await awardBadgeAction(userId, badge.id);
  }

  // Badge: 100+ XP
  if (xp >= 100) {
    const [badge] = await sql`SELECT id FROM badges WHERE name = 'XP Hunter'`;
    if (badge) await awardBadgeAction(userId, badge.id);
  }

  // Badge: 10+ wishlist
  if (wishlistCount[0]?.count >= 10) {
    const [badge] = await sql`SELECT id FROM badges WHERE name = 'Wishlist Master'`;
    if (badge) await awardBadgeAction(userId, badge.id);
  }

  // Badge: 5+ playlists
  if (playlistCount[0]?.count >= 5) {
    const [badge] = await sql`SELECT id FROM badges WHERE name = 'Curator'`;
    if (badge) await awardBadgeAction(userId, badge.id);
  }

  return true;
}
