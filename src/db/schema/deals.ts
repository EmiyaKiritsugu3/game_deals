import { pgTable, uuid, varchar, real, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { games } from './games';

export const store = pgEnum('store', ['steam', 'epic', 'gog', 'humble', 'fanatical', 'greenmangaming', 'nuuvem']);

export const deals = pgTable('deals', {
  id: uuid().defaultRandom().primaryKey(),
  gameId: uuid().notNull().references(() => games.id),
  storeId: store().notNull(),
  price: real().notNull(),
  retailPrice: real().notNull(),
  savings: real().notNull(),
  dealRating: real(),
  url: varchar({ length: 2000 }),
  createdAt: timestamp().defaultNow().notNull(),
}, (table) => [
  index('deals_gameId_idx').on(table.gameId),
  index('deals_store_game_idx').on(table.storeId, table.gameId),
  index('deals_rating_idx').on(table.dealRating),
]);
