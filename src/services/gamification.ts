import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { activities, badges, userBadges, userStats } from '@/db/schema';

const XP_PER_ACTION = 5;

// --- Types ---

interface BadgeDef {
  name: string;
  actionType: string;
  count: number;
  xp: number;
  rarity: string;
}

interface BadgeInfo {
  name: string;
  rarity: string;
}

export interface ProcessActionResult {
  xpGained: number;
  xpTotal: number;
  newBadges: BadgeInfo[];
  leveledUp: boolean;
  newLevel: number;
}

export interface UserProfile {
  stats: {
    xp: number;
    level: number;
    optInLeaderboard: boolean;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string | null;
    iconSvg: string;
    rarity: string | null;
    awardedAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    actionType: string;
    details: unknown;
    createdAt: Date;
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  xp: number;
  badgeCount: number;
}

// --- Constants ---

export const BADGE_DEFS: BadgeDef[] = [
  { name: 'First Wish', actionType: 'wishlist_add', count: 1, xp: 10, rarity: 'Common' },
  { name: 'Wishlist Collector', actionType: 'wishlist_add', count: 10, xp: 50, rarity: 'Uncommon' },
  { name: 'Wishlist Hoarder', actionType: 'wishlist_add', count: 50, xp: 150, rarity: 'Rare' },
  { name: 'Playlist Creator', actionType: 'playlist_create', count: 1, xp: 25, rarity: 'Common' },
  { name: 'Playlist Master', actionType: 'playlist_create', count: 5, xp: 75, rarity: 'Uncommon' },
  { name: 'Playlist Legend', actionType: 'playlist_create', count: 10, xp: 150, rarity: 'Rare' },
  { name: 'Bargain Hunter', actionType: 'alert_create', count: 1, xp: 15, rarity: 'Common' },
  { name: 'Deal Hawk', actionType: 'alert_create', count: 5, xp: 75, rarity: 'Uncommon' },
  { name: 'Price Watcher', actionType: 'alert_create', count: 15, xp: 150, rarity: 'Rare' },
  { name: 'All-Rounder', actionType: '__meta__', count: 3, xp: 100, rarity: 'Epic' },
];

// --- Helpers ---

export function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 10));
}

function getBadgeIconSvg(rarity: string, _name: string): string {
  const colors: Record<string, string> = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
  };
  const color = colors[rarity] ?? '#9ca3af';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
}

async function getBadgeCategories(userId: string): Promise<Set<string>> {
  const earned = await db
    .select({ name: badges.name })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));

  const categories = new Set<string>();
  for (const row of earned) {
    const def = BADGE_DEFS.find((d) => d.name === row.name);
    if (def && def.actionType !== '__meta__') {
      const category = def.actionType.split('_')[0];
      categories.add(category);
    }
  }
  return categories;
}

// --- API Functions ---

export async function processAction(
  userId: string,
  actionType: string,
  details?: Record<string, unknown>
): Promise<ProcessActionResult | null> {
  try {
    // 1. Log activity
    await db.insert(activities).values({
      userId,
      actionType,
      details: details ?? null,
    });

    // 2. Upsert user_stats — add XP
    await db
      .insert(userStats)
      .values({ userId, xp: XP_PER_ACTION })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: { xp: sql`user_stats.xp + ${XP_PER_ACTION}` },
      });

    // 3. Read current XP
    const [stats] = await db
      .select({ xp: userStats.xp })
      .from(userStats)
      .where(eq(userStats.userId, userId));

    const xpTotal = stats?.xp ?? XP_PER_ACTION;
    const prevLevel = calcLevel(xpTotal - XP_PER_ACTION);
    const newLevel = calcLevel(xpTotal);

    // 4. Check badge criteria
    const newBadges: BadgeInfo[] = [];
    const relevantDefs = BADGE_DEFS.filter(
      (b) => b.actionType === actionType || b.actionType === '__meta__'
    );

    for (const badgeDef of relevantDefs) {
      let earned = false;

      if (badgeDef.actionType === '__meta__') {
        const categories = await getBadgeCategories(userId);
        earned = categories.size >= badgeDef.count;
      } else {
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(activities)
          .where(and(eq(activities.userId, userId), eq(activities.actionType, actionType)));

        earned = result.count >= badgeDef.count;
      }

      if (earned) {
        try {
          await db.execute(sql`SELECT award_badge(${userId}, ${badgeDef.name})`);
          newBadges.push({ name: badgeDef.name, rarity: badgeDef.rarity });
        } catch {
          // Duplicate badge — award_badge is idempotent
        }
      }
    }

    return {
      xpGained: XP_PER_ACTION,
      xpTotal,
      newBadges,
      leveledUp: newLevel > prevLevel,
      newLevel,
    };
  } catch (error) {
    console.error('gamification processAction failed:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const [statsRow] = await db
      .select({ xp: userStats.xp, optInLeaderboard: userStats.optInLeaderboard })
      .from(userStats)
      .where(eq(userStats.userId, userId));

    const [badgesData, recentActivity] = await Promise.all([
      db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
          iconSvg: badges.iconSvg,
          rarity: badges.rarity,
          awardedAt: userBadges.awardedAt,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, userId))
        .orderBy(desc(userBadges.awardedAt)),
      db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(20),
    ]);

    return {
      stats: {
        xp: statsRow?.xp ?? 0,
        level: calcLevel(statsRow?.xp ?? 0),
        optInLeaderboard: statsRow?.optInLeaderboard ?? false,
      },
      badges: badgesData,
      recentActivity,
    };
  } catch (error) {
    console.error('gamification getUserProfile failed:', error);
    return null;
  }
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[] | null> {
  try {
    return db
      .select({
        userId: userStats.userId,
        xp: userStats.xp,
        badgeCount: sql<number>`(
          SELECT count(*)::int FROM ${userBadges}
          WHERE ${userBadges.userId} = "user_stats"."userId"
        )`,
      })
      .from(userStats)
      .where(eq(userStats.optInLeaderboard, true))
      .orderBy(desc(userStats.xp))
      .limit(limit);
  } catch (error) {
    console.error('gamification getLeaderboard failed:', error);
    return null;
  }
}

export async function seedBadges(): Promise<void> {
  try {
    const badgeInserts = BADGE_DEFS.map((def) => ({
      name: def.name,
      description:
        def.actionType === '__meta__'
          ? 'Earned by collecting badges across all categories'
          : `Earned by performing ${def.actionType.replace('_', ' ')} ${def.count} time(s)`,
      iconSvg: getBadgeIconSvg(def.rarity, def.name),
      rarity: def.rarity,
      criteria: { actionType: def.actionType, count: def.count, xp: def.xp },
    }));
    await db.insert(badges).values(badgeInserts).onConflictDoNothing({ target: badges.name });
  } catch (error) {
    console.error('gamification seedBadges failed:', error);
  }
}
