-- Migration: 0010_optimize_check_alerts
-- Description: Refactor check_alerts_for_all() to set-based processing with 64-bit advisory locks.
-- Changes:
--   1. Replace cursor loop with CTE-based set operations
--   2. Upgrade advisory lock from 32-bit hashtext() to 64-bit md5→bigint
--   3. Preserve 1-hour dedupe window with NOT EXISTS
--
-- Performance: O(n) → O(1) queries (single CTE chain vs N+1 cursor)
-- Safety: 64-bit lock keys eliminate collision risk at scale
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.check_alerts_for_all();
--   Then re-run 0005_notifications.sql CREATE FUNCTION to restore cursor-based version.

--> statement-breakpoint

DROP FUNCTION IF EXISTS public.check_alerts_for_all();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.check_alerts_for_all()
RETURNS TABLE (
  notification_id uuid,
  user_id        uuid,
  game_id        uuid,
  store_id       varchar,
  target_price   real,
  current_price  real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lock_key bigint;
  c_kind CONSTANT text := 'price_alert';
BEGIN
  -- Acquire 64-bit advisory lock (md5 → bigint) to prevent concurrent cron race conditions.
  -- Uses full 64-bit range vs 32-bit hashtext() which only has 2^32 slots.
  v_lock_key := ('x' || substr(md5('check_alerts_for_all'), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  RETURN QUERY
  WITH alert_targets AS (
    -- Step 1: Find all active alerts with their lowest current deal price
    SELECT
      pa.id           AS alert_id,
      pa."userId",
      pa."gameId",
      pa."storeId",
      pa."targetPrice",
      pa."createdAt"  AS alert_created,
      COALESCE(g.title, 'Your game') AS game_title,
      MIN(d.price)    AS lowest_price
    FROM price_alerts pa
    JOIN games g ON g.id = pa."gameId"
    LEFT JOIN deals d ON d."gameId" = pa."gameId"
      AND (pa."storeId" IS NULL OR d."storeId"::text = pa."storeId")
    WHERE pa."isActive" = 1
    GROUP BY pa.id, pa."userId", pa."gameId", pa."storeId", pa."targetPrice", pa."createdAt", g.title
  ),
  triggered AS (
    -- Step 2: Filter to alerts where lowest price is at or below target
    SELECT * FROM alert_targets
    WHERE lowest_price IS NOT NULL
      AND lowest_price <= "targetPrice"
  ),
  deduped AS (
    -- Step 3: Update currentPrice for all checked alerts
    -- Then return only non-duplicate notifications (within 1-hour window)
    UPDATE price_alerts pa
    SET
      "currentPrice"  = t.lowest_price,
      "lastCheckedAt" = NOW()
    FROM triggered t
    WHERE pa.id = t.alert_id
    RETURNING t.*
  )
  -- Step 4: Insert notifications for non-duplicate triggered alerts
  INSERT INTO notifications ("userId", kind, title, body, payload)
  SELECT
    d."userId",
    c_kind,
    format('Price drop: %s', d.game_title),
    format('Now $%s (target $%s)', d.lowest_price::text, d."targetPrice"::text),
    jsonb_build_object(
      'gameId', d."gameId",
      'alertId', d.alert_id,
      'currentPrice', d.lowest_price,
      'targetPrice', d."targetPrice"
    )
  FROM deduped d
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n."userId" = d."userId"
      AND n.kind = c_kind
      AND (n.payload->>'gameId')::uuid = d."gameId"
      AND (n.payload->>'targetPrice')::numeric = d."targetPrice"
      AND n."createdAt" > NOW() - INTERVAL '1 hour'
  )
  RETURNING
    id               AS notification_id,
    "userId"         AS user_id,
    ("payload"->>'gameId')::uuid AS game_id,
    NULL::varchar    AS store_id,
    ("payload"->>'targetPrice')::real AS target_price,
    ("payload"->>'currentPrice')::real AS current_price;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.check_alerts_for_all() FROM PUBLIC;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.check_alerts_for_all() TO service_role;
