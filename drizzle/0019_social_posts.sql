-- 0019_social_posts.sql — Sprint 4: social auto-post dedup (Tasks 3.1/3.2/4.1)
-- Tracks which deals were already posted to each external channel so crons
-- never double-post. One row per (channel, dealID).
-- Idempotent via unique index.

CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" varchar(30) NOT NULL,
	"deal_id" varchar(50) NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "social_channel_deal_unique" ON "social_posts" ("channel", "deal_id");
