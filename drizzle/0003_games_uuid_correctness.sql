-- Migration: 0003_games_uuid_correctness
-- Description: Enforce cheapsharkId NOT NULL UNIQUE on games and create
-- resolve_game_uuid(p_cheapshark_id) and resolve_cheapshark_id(p_uuid)
-- helpers for uuid <-> cheapsharkId lookups.

--> statement-breakpoint

ALTER TABLE "games"
  ALTER COLUMN "cheapsharkId" SET NOT NULL;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'games_cheapsharkId_unique'
  ) THEN
    ALTER TABLE "games"
      ADD CONSTRAINT "games_cheapsharkId_unique" UNIQUE ("cheapsharkId");
  END IF;
END $$;--> statement-breakpoint

DROP FUNCTION IF EXISTS public.resolve_game_uuid(public."cheapsharkId"%TYPE);--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.resolve_game_uuid(p_cheapshark_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.games WHERE "cheapsharkId" = p_cheapshark_id LIMIT 1
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.resolve_game_uuid(text) FROM PUBLIC;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.resolve_game_uuid(text) TO service_role;--> statement-breakpoint

DROP FUNCTION IF EXISTS public.resolve_cheapshark_id(uuid);--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.resolve_cheapshark_id(p_game_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT "cheapsharkId" FROM public.games WHERE id = p_game_id LIMIT 1
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.resolve_cheapshark_id(uuid) FROM PUBLIC;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.resolve_cheapshark_id(uuid) TO service_role;--> statement-breakpoint
