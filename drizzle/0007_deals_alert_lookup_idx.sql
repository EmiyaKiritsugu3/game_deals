-- Migration: 0007_deals_alert_lookup_idx
-- Description: Add composite index on deals (gameId, price) to support
-- the MIN(price) lookup in check_alerts_for_all() cron function.
-- This avoids sequential scans when finding the lowest price per game.

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "deals_gameId_price_idx" ON "deals" ("gameId", "price");--> statement-breakpoint