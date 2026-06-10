import { pgTable, uuid, timestamp, varchar, integer, real } from 'drizzle-orm/pg-core';
import { games } from './games';

export const priceHistory = pgTable('price_history', {
  id: uuid().defaultRandom().primaryKey(),
  gameId: uuid().notNull().references(() => games.id),
  storeId: varchar({ length: 50 }).notNull(),
  price: real().notNull(),
  retailPrice: real().notNull(),
  recordedAt: timestamp().defaultNow().notNull(),
});

export const priceAlerts = pgTable('price_alerts', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  gameId: uuid().notNull().references(() => games.id),
  targetPrice: real().notNull(),
  storeId: varchar({ length: 50 }),
  isActive: integer().default(1).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
