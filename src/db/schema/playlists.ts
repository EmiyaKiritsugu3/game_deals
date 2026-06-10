import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const playlists = pgTable('playlists', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  isPublic: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const playlistGames = pgTable('playlist_games', {
  id: uuid().defaultRandom().primaryKey(),
  playlistId: uuid().notNull().references(() => playlists.id),
  gameId: uuid().notNull(),
  notes: varchar({ length: 500 }),
  addedAt: timestamp().defaultNow().notNull(),
});
