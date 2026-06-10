import { pgTable, uuid, varchar, timestamp, real } from 'drizzle-orm/pg-core';

export const affiliateLinks = pgTable('affiliate_links', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: varchar({ length: 50 }).notNull(),
  gameSlug: varchar({ length: 255 }).notNull(),
  network: varchar({ length: 50 }).notNull(),
  url: varchar({ length: 2000 }).notNull(),
  trackingTemplate: varchar({ length: 2000 }),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const affiliateClicks = pgTable('affiliate_clicks', {
  id: uuid().defaultRandom().primaryKey(),
  storeId: varchar({ length: 50 }).notNull(),
  gameSlug: varchar({ length: 255 }).notNull(),
  userId: uuid(),
  ip: varchar({ length: 45 }),
  timestamp: timestamp().defaultNow().notNull(),
});
