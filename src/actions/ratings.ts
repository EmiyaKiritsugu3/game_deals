'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { gameAvgRatings, gameRatings } from '@/db/schema';
import { createClient } from '@/utils/supabase/server';

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

function validateRating(rating: number): asserts rating is number {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
}

/**
 * Upsert authenticated user's rating for a game.
 * Throws if not authenticated — anonymous callers should use localStorage.
 */
export async function rateGame(gameId: string, rating: number): Promise<{ id: string }> {
  const user = await requireAuth();
  validateRating(rating);

  const [result] = await db
    .insert(gameRatings)
    .values({ gameId, userId: user.id, rating })
    .onConflictDoUpdate({
      target: [gameRatings.gameId, gameRatings.userId],
      set: { rating },
    })
    .returning({ id: gameRatings.id });

  return result;
}

/**
 * Get authenticated user's rating for a game.
 * Returns null when not authenticated or user has not rated.
 */
export async function getGameRating(gameId: string): Promise<{ rating: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [row] = await db
    .select({ rating: gameRatings.rating })
    .from(gameRatings)
    .where(and(eq(gameRatings.gameId, gameId), eq(gameRatings.userId, user.id)))
    .limit(1);

  return row ?? null;
}

/**
 * Get average rating, total count, and Bayesian average for a game.
 * Queries the game_avg_ratings MATERIALIZED VIEW.
 * Always returns, even when no ratings exist (average = 0, count = 0, bayesianAvg = 0).
 */
export async function getAvgRating(
  gameId: string
): Promise<{ average: number; count: number; bayesianAvg: number }> {
  const [row] = await db.select().from(gameAvgRatings).where(eq(gameAvgRatings.gameId, gameId));

  if (!row) {
    return { average: 0, count: 0, bayesianAvg: 0 };
  }

  return {
    average: Number(row.averageRating),
    count: Number(row.ratingCount),
    bayesianAvg: Number(row.bayesianAvg),
  };
}
