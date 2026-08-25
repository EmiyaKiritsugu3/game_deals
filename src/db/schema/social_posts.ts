import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Social auto-post dedup (Sprint 4). One row per (channel, dealId).
 * Crons insert with ON CONFLICT DO NOTHING — conflict means already posted.
 */
export const socialPosts = pgTable(
  'social_posts',
  {
    id: uuid().defaultRandom().primaryKey(),
    channel: varchar({ length: 30 }).notNull(),
    dealId: varchar({ length: 50 }).notNull(),
    postedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [uniqueIndex('social_channel_deal_unique').on(table.channel, table.dealId)]
);
