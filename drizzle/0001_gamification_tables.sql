-- Migration: 0001_gamification_tables
-- Description: Add badges, user_badges, activities, and wishlists tables for gamification features

CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"iconSvg" text NOT NULL,
	"rarity" varchar(20) DEFAULT 'Common',
	"criteria" jsonb NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);--> statement-breakpoint

CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"badgeId" uuid NOT NULL,
	"awardedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_badge_unique" UNIQUE("userId", "badgeId")
);--> statement-breakpoint

CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"actionType" varchar(50) NOT NULL,
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"gameId" uuid NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlists_user_game_unique" UNIQUE("userId", "gameId")
);--> statement-breakpoint

ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_badges_id_fk" FOREIGN KEY ("badgeId") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Add indexes for performance
CREATE INDEX "user_badges_userId_idx" ON "user_badges" ("userId");--> statement-breakpoint
CREATE INDEX "activities_userId_idx" ON "activities" ("userId");--> statement-breakpoint
CREATE INDEX "wishlists_userId_idx" ON "wishlists" ("userId");--> statement-breakpoint
CREATE INDEX "wishlists_gameId_idx" ON "wishlists" ("gameId");
