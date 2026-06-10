import { pgTable, uuid, varchar, real, timestamp, pgEnum } from 'drizzle-orm/pg-core';
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
});
