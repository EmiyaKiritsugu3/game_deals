import { integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { games } from './games';

export const gameRatings = pgTable(
  'game_ratings',
  {
    id: uuid().defaultRandom().primaryKey(),
    gameId: uuid()
      .notNull()
      .references(() => games.id),
    userId: uuid().notNull(),
    rating: integer().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [uniqueIndex('gr_game_user_unique').on(table.gameId, table.userId)]
);
