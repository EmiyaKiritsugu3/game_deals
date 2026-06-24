import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const badges = pgTable('badges', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  iconSvg: text().notNull(),
  rarity: varchar({ length: 20 }).default('Common'),
  criteria: jsonb().notNull(),
});

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull(),
    badgeId: uuid().notNull(),
    awardedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [uniqueIndex('user_badges_user_badge_unique').on(table.userId, table.badgeId)]
);

export const activities = pgTable('activities', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  actionType: varchar({ length: 50 }).notNull(),
  details: jsonb(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const userStats = pgTable('user_stats', {
  userId: uuid().notNull().primaryKey(),
  xp: integer().notNull().default(0),
  optInLeaderboard: boolean().notNull().default(false),
});

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull(),
    gameId: uuid().notNull(),
    addedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [uniqueIndex('wishlists_user_game_unique').on(table.userId, table.gameId)]
);
