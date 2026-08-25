-- 0020_premium_users.sql - Sprint 4: premium subscription (Tasks 6.1/6.2)
-- premiumUntil: null = free, future date = active premium. Set by Stripe webhook.
-- stripeCustomerId links profile to Stripe customer for portal/billing.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "premium_until" timestamp;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
CREATE INDEX IF NOT EXISTS "profiles_stripe_customer_idx" ON "profiles" ("stripe_customer_id");
