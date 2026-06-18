import { index, pgTable, real, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { games } from './games';

export const deals = pgTable(
  'deals',
  {
    id: uuid().defaultRandom().primaryKey(),
    gameId: uuid()
      .notNull()
      .references(() => games.id),
    storeId: varchar({ length: 50 }).notNull(),
    price: real().notNull(),
    retailPrice: real().notNull(),
    savings: real().notNull(),
    dealRating: real(),
    url: varchar({ length: 2000 }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('deals_gameId_idx').on(table.gameId),
    index('deals_store_game_idx').on(table.storeId, table.gameId),
    index('deals_rating_idx').on(table.dealRating),
    index('deals_game_store_price_idx').on(table.gameId, table.storeId, table.price),
    uniqueIndex('deals_game_store_unique').on(table.gameId, table.storeId),
  ]
);
