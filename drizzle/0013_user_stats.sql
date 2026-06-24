-- Migration: 0013_user_stats
-- Description: Add user_stats table for gamification XP tracking and leaderboard opt-in,
-- plus idempotent award_badge function for badge progression system.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS award_badge;
--   DROP TABLE IF EXISTS user_stats;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_stats" (
  "userId" uuid NOT NULL,
  "xp" integer NOT NULL DEFAULT 0,
  "optInLeaderboard" boolean NOT NULL DEFAULT false,
  CONSTRAINT "user_stats_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "user_stats_pkey" PRIMARY KEY ("userId")
);--> statement-breakpoint

CREATE INDEX "user_stats_xp_idx" ON "user_stats" ("xp");--> statement-breakpoint

ALTER TABLE "user_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "users read own stats" ON "user_stats"
  FOR SELECT
  USING (auth.uid() = "userId");--> statement-breakpoint

CREATE POLICY "system upserts user stats" ON "user_stats"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");--> statement-breakpoint

CREATE POLICY "system updates user stats" ON "user_stats"
  FOR UPDATE
  USING (auth.uid() = "userId");--> statement-breakpoint

CREATE OR REPLACE FUNCTION "award_badge"(p_user_id uuid, p_badge_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_badge_id uuid;
  v_result   uuid;
BEGIN
  SELECT "id" INTO v_badge_id FROM "badges" WHERE "name" = p_badge_name;
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge not found: %', p_badge_name;
  END IF;

  INSERT INTO "user_badges" ("userId", "badgeId")
  VALUES (p_user_id, v_badge_id)
  ON CONFLICT ("userId", "badgeId") DO NOTHING
  RETURNING "id" INTO v_result;

  RETURN v_result;
END;
$$;
