-- Migration: 0008_pr15_price_alerts_indexes
-- Description: (a) Drop redundant non-unique pa_user_game_idx.
-- (b) Ensure pa_user_game_unique exists in production.
-- (b) is a defense-in-depth fix for a latent bug: createPriceAlertAction
-- uses ON CONFLICT ("userId","gameId") which requires this unique constraint,
-- but the index was never added to any prior migration.

--> statement-breakpoint

DROP INDEX IF EXISTS "public"."pa_user_game_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pa_user_game_unique" ON "public"."price_alerts" ("userId", "gameId");
