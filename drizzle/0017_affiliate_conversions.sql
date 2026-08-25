-- 0017_affiliate_conversions.sql — Sprint 1: postback S2S receiver support
-- Stores conversions (sales) reported by affiliate networks via /api/postback.
-- Network postbacks send order_id (unique per network), commission, status.
-- click_id correlates back to affiliate_clicks.id for funnel analytics.
-- Idempotent via unique constraint on order_id (networks retry).
-- ponytail: jsonb raw_payload for audit trail — no separate audit log needed.
-- NOTE: no CONCURRENTLY - drizzle-kit migrate wraps each file in a transaction and
-- Postgres forbids CREATE INDEX CONCURRENTLY inside transactions.

CREATE TABLE IF NOT EXISTS "affiliate_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storeId" varchar(50) NOT NULL,
	"gameSlug" varchar(255),
	"orderId" varchar(100) NOT NULL,
	"clickId" uuid,
	"commissionCents" integer NOT NULL DEFAULT 0,
	"currency" varchar(3) NOT NULL DEFAULT 'USD',
	"status" varchar(20) NOT NULL DEFAULT 'pending',
	"rawPayload" jsonb,
	"convertedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "acv_order_id_unique" ON "affiliate_conversions" ("orderId");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "acv_store_converted_idx" ON "affiliate_conversions" ("storeId", "convertedAt" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "acv_click_id_idx" ON "affiliate_conversions" ("clickId");
