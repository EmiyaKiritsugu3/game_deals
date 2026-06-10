import { pgTable, uuid, varchar, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const games = pgTable('games', {
  id: uuid().defaultRandom().primaryKey(),
  cheapsharkId: varchar({ length: 50 }).unique(),
  title: varchar({ length: 255 }).notNull(),
  alternativeTitles: varchar({ length: 255 }).array(),
  developer: varchar({ length: 100 }),
  publisher: varchar({ length: 100 }),
  platform: varchar({ length: 50 }).array(),
  genre: varchar({ length: 50 }).array(),
  metacriticScore: integer(),
  steamRating: real(),
  thumbUrl: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
