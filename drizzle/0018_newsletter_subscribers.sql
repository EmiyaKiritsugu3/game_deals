-- 0018_newsletter_subscribers.sql — Sprint 4: newsletter capture (Task 1.3)
-- Double opt-in: status 'pending' → 'active' after confirm link click.
-- unsubscribeToken powers one-click unsub in email footer.
-- Idempotent via unique index on email.

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL DEFAULT 'pending',
	"confirm_token" uuid NOT NULL DEFAULT gen_random_uuid(),
	"unsubscribe_token" uuid NOT NULL DEFAULT gen_random_uuid(),
	"source" varchar(50) NOT NULL DEFAULT 'web',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS "nls_email_unique" ON "newsletter_subscribers" ("email");
CREATE INDEX IF NOT EXISTS "nls_status_idx" ON "newsletter_subscribers" ("status");
CREATE INDEX IF NOT EXISTS "nls_confirm_token_idx" ON "newsletter_subscribers" ("confirm_token");
CREATE INDEX IF NOT EXISTS "nls_unsub_token_idx" ON "newsletter_subscribers" ("unsubscribe_token");
