-- 0016_rls.sql — FASE 2.2: Enable RLS + per-userId policies on user-scoped tables
-- Covers: price_alerts, game_ratings, activities, wishlists, profiles, playlist_games
-- Idempotent: DO $$ IF NOT EXISTS (pattern from 0005_notifications / 0013_user_stats)
-- Service role bypasses RLS; anon/unauthenticated denied by default (no policy TO anon).
-- ponytail: policies via auth.uid() = "userId" — single rule per table, no per-column grants.

-- ════════════════════════════════════════════════════════════
-- price_alerts
-- ════════════════════════════════════════════════════════════
ALTER TABLE "price_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'price_alerts' AND policyname = 'price_alerts_select_own') THEN
    CREATE POLICY price_alerts_select_own ON public.price_alerts
      FOR SELECT TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'price_alerts' AND policyname = 'price_alerts_insert_own') THEN
    CREATE POLICY price_alerts_insert_own ON public.price_alerts
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'price_alerts' AND policyname = 'price_alerts_update_own') THEN
    CREATE POLICY price_alerts_update_own ON public.price_alerts
      FOR UPDATE TO authenticated
      USING ("userId" = auth.uid())
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'price_alerts' AND policyname = 'price_alerts_delete_own') THEN
    CREATE POLICY price_alerts_delete_own ON public.price_alerts
      FOR DELETE TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

-- ════════════════════════════════════════════════════════════
-- game_ratings — SELECT public (drive aggregate view), INSERT/UPDATE/DELETE own
-- ════════════════════════════════════════════════════════════
ALTER TABLE "game_ratings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_ratings' AND policyname = 'game_ratings_select_public') THEN
    CREATE POLICY game_ratings_select_public ON public.game_ratings
      FOR SELECT TO authenticated, anon
      USING (true);
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_ratings' AND policyname = 'game_ratings_insert_own') THEN
    CREATE POLICY game_ratings_insert_own ON public.game_ratings
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_ratings' AND policyname = 'game_ratings_update_own') THEN
    CREATE POLICY game_ratings_update_own ON public.game_ratings
      FOR UPDATE TO authenticated
      USING ("userId" = auth.uid())
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_ratings' AND policyname = 'game_ratings_delete_own') THEN
    CREATE POLICY game_ratings_delete_own ON public.game_ratings
      FOR DELETE TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

-- ════════════════════════════════════════════════════════════
-- activities — SELECT own only (system inserts via service role, bypasses RLS)
-- ════════════════════════════════════════════════════════════
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activities' AND policyname = 'activities_select_own') THEN
    CREATE POLICY activities_select_own ON public.activities
      FOR SELECT TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

-- ════════════════════════════════════════════════════════════
-- wishlists
-- ════════════════════════════════════════════════════════════
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_select_own') THEN
    CREATE POLICY wishlists_select_own ON public.wishlists
      FOR SELECT TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_insert_own') THEN
    CREATE POLICY wishlists_insert_own ON public.wishlists
      FOR INSERT TO authenticated
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_delete_own') THEN
    CREATE POLICY wishlists_delete_own ON public.wishlists
      FOR DELETE TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

-- ════════════════════════════════════════════════════════════
-- profiles — SELECT public, INSERT/UPDATE own (id = auth.uid())
-- ════════════════════════════════════════════════════════════
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_public') THEN
    CREATE POLICY profiles_select_public ON public.profiles
      FOR SELECT TO authenticated, anon
      USING (true);
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_own') THEN
    CREATE POLICY profiles_insert_own ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;--> statement-breakpoint

-- ════════════════════════════════════════════════════════════
-- playlist_games — SELECT public-orchown; ALL own via parent playlist ownership.
-- ponytail: exist: RLS join-subquery on parent playlists; tighten per-row if abuse seen.
-- ════════════════════════════════════════════════════════════
ALTER TABLE "playlist_games" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'playlist_games' AND policyname = 'playlist_games_select_visible') THEN
    CREATE POLICY playlist_games_select_visible ON public.playlist_games
      FOR SELECT TO authenticated, anon
      USING (
        EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = "playlist_games"."playlistId" AND p."isPublic" = true)
        OR EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = "playlist_games"."playlistId" AND p."userId" = auth.uid())
      );
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'playlist_games' AND policyname = 'playlist_games_manage_own') THEN
    CREATE POLICY playlist_games_manage_own ON public.playlist_games
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = "playlist_games"."playlistId" AND p."userId" = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = "playlist_games"."playlistId" AND p."userId" = auth.uid()));
  END IF;
END $$;--> statement-breakpoint
