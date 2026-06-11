CREATE TYPE "public"."store" AS ENUM('steam', 'epic', 'gog', 'humble', 'fanatical', 'greenmangaming', 'nuuvem');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'mod', 'admin');--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storeId" varchar(50) NOT NULL,
	"gameSlug" varchar(255) NOT NULL,
	"userId" uuid,
	"ip" varchar(45),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storeId" varchar(50) NOT NULL,
	"gameSlug" varchar(255) NOT NULL,
	"network" varchar(50) NOT NULL,
	"url" varchar(2000) NOT NULL,
	"trackingTemplate" varchar(2000),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gameId" uuid NOT NULL,
	"storeId" "store" NOT NULL,
	"price" real NOT NULL,
	"retailPrice" real NOT NULL,
	"savings" real NOT NULL,
	"dealRating" real,
	"url" varchar(2000),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cheapsharkId" varchar(50),
	"title" varchar(255) NOT NULL,
	"alternativeTitles" varchar(255)[],
	"developer" varchar(100),
	"publisher" varchar(100),
	"platform" varchar(50)[],
	"genre" varchar(50)[],
	"metacriticScore" integer,
	"steamRating" real,
	"thumbUrl" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_cheapsharkId_unique" UNIQUE("cheapsharkId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"username" varchar(100),
	"avatarUrl" varchar(500),
	"role" "user_role" DEFAULT 'user',
	"xp" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"gameId" uuid NOT NULL,
	"targetPrice" real NOT NULL,
	"storeId" varchar(50),
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gameId" uuid NOT NULL,
	"storeId" varchar(50) NOT NULL,
	"price" real NOT NULL,
	"retailPrice" real NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlistId" uuid NOT NULL,
	"gameId" uuid NOT NULL,
	"notes" varchar(500),
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" varchar(500),
	"isPublic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_games" ADD CONSTRAINT "playlist_games_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;