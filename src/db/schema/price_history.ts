import { index, pgTable, real, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { games } from './games';

export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid().defaultRandom().primaryKey(),
    gameId: uuid()
      .notNull()
      .references(() => games.id),
    storeId: varchar({ length: 50 }).notNull(),
    price: real().notNull(),
    retailPrice: real().notNull(),
    recordedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('ph_game_store_recorded_idx').on(table.gameId, table.storeId, table.recordedAt.desc()),
  ]
);
