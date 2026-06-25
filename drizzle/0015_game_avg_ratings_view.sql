-- Migration: 0015_game_avg_ratings_view
-- Description: Create game_avg_ratings view with Bayesian average.
-- Uses global prior: C = global mean rating, m = 5 (minimum ratings threshold).
-- Bayesian avg = (avg_rating * rating_count + C * m) / (rating_count + m)
--
-- Rollback:
-- DROP VIEW IF EXISTS public.game_avg_ratings;

--> statement-breakpoint

CREATE OR REPLACE VIEW "public"."game_avg_ratings" AS
WITH global_stats AS (
  SELECT
    COALESCE(AVG(rating), 0)::numeric(3,2) AS global_avg
  FROM "game_ratings"
)
SELECT
  gr."gameId",
  COALESCE(AVG(gr.rating), 0)::numeric(3,2) AS "averageRating",
  COUNT(*)::int AS "ratingCount",
  CASE
    WHEN COUNT(*) = 0 THEN 0::numeric(3,2)
    ELSE (
      (COALESCE(AVG(gr.rating), 0) * COUNT(*)::numeric + 5.0 * gs.global_avg)
      / (COUNT(*)::numeric + 5.0)
    )::numeric(3,2)
  END AS "bayesianAvg"
FROM "game_ratings" gr
CROSS JOIN global_stats gs
GROUP BY gr."gameId", gs.global_avg;
