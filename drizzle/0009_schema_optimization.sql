-- Migration: 0009_schema_optimization
-- Description: Add optimized indexes for cron queries and notification feed.
-- Adds:
--   1. pa_active_game_idx — partial index on active price_alerts for cron scan
--   2. deals_game_store_price_idx — composite index for ingest upsert dedup
--   3. notifications_user_created_idx — index for notification feed queries
--
-- Rollback:
--   DROP INDEX IF EXISTS pa_active_game_idx;
--   DROP INDEX IF EXISTS deals_game_store_price_idx;
--   DROP INDEX IF EXISTS notifications_user_created_idx;

--> statement-breakpoint

-- Index 1: Partial index on active price_alerts for check_alerts_for_all() cron query
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pa_active_game_idx"
  ON "public"."price_alerts" ("isActive", "gameId")
  WHERE "isActive" = 1;--> statement-breakpoint

-- Index 2: Composite index on deals for ingest upsert dedup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "deals_game_store_price_idx"
  ON "public"."deals" ("gameId", "storeId", "price");--> statement-breakpoint

-- Index 3: Index on notifications for feed queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_user_created_idx"
  ON "public"."notifications" ("userId", "createdAt" DESC);
