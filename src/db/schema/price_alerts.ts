import {
  index,
  integer,
  pgTable,
  real,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { games } from './games';

export const priceAlerts = pgTable(
  'price_alerts',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull(),
    gameId: uuid()
      .notNull()
      .references(() => games.id),
    targetPrice: real().notNull(),
    storeId: varchar({ length: 50 }),
    isActive: integer().default(1).notNull(),
    currentPrice: real(),
    lastCheckedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('pa_user_game_idx').on(table.userId, table.gameId),
    uniqueIndex('pa_user_game_unique').on(table.userId, table.gameId),
  ]
);
