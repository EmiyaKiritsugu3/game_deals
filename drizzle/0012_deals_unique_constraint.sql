-- Migration: 0012_deals_unique_constraint
-- Description: Add unique index on (gameId, storeId) to prevent duplicate deals
-- from the same game in the same store. Enables ON CONFLICT DO UPDATE upsert behavior.
--
-- The Drizzle schema (src/db/schema/deals.ts) already declares this uniqueIndex,
-- ensuring generated Drizzle queries use it for onConflictDoUpdate.
--
-- Rollback:
--   DROP INDEX IF EXISTS "deals_game_store_unique";

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "deals_game_store_unique" ON "deals" ("gameId", "storeId");
