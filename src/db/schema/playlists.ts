import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const playlists = pgTable(
  'playlists',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull(),
    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }),
    isPublic: boolean().default(false).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('pl_userId_idx').on(table.userId),
    uniqueIndex('pl_user_slug_unique').on(table.userId, table.slug),
  ]
);

export const playlistGames = pgTable(
  'playlist_games',
  {
    id: uuid().defaultRandom().primaryKey(),
    playlistId: uuid()
      .notNull()
      .references(() => playlists.id),
    gameId: uuid().notNull(),
    notes: varchar({ length: 500 }),
    addedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('pg_playlist_game_unique').on(table.playlistId, table.gameId),
    index('pg_gameId_idx').on(table.gameId),
  ]
);
