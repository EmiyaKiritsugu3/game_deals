-- Migration: 0011_rate_limits
-- Description: Create rate_limits table for distributed rate limiting across server instances.
-- Replaces in-memory Map-based rate limiter with a PostgreSQL-backed solution.
--
-- Performance: pg_advisory_xact_lock prevents concurrent cron race conditions
-- Safety: Auto-cleanup of expired entries via DELETE in application code
--
-- Rollback:
--   DROP TABLE IF EXISTS rate_limits;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (key);
