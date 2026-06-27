import { integer, numeric, pgView, uuid } from 'drizzle-orm/pg-core';

export const gameAvgRatings = pgView('game_avg_ratings', {
  gameId: uuid('gameId').notNull(),
  averageRating: numeric('averageRating', { precision: 3, scale: 2 }),
  ratingCount: integer('ratingCount').notNull(),
  bayesianAvg: numeric('bayesianAvg', { precision: 3, scale: 2 }),
}).existing();
