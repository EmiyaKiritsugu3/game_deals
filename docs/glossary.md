---
title: Domain Glossary — GameDeals
type: reference
status: active
scope: project
tags:
  - glossary
  - domain
related:
  - tech-stack
  - database-schema
updated: "2026-06-21"
---

# Domain Glossary — GameDeals

Ubiquitous Language (Eric Evans, DDD). Covers core domain concepts only.
See [tech-stack.md](./tech-stack.md) for technology terms (Next.js, PostgreSQL, etc.).

## Core Domain

| Term | Definition | Aliases to Avoid | Notes |
|------|------------|------------------|-------|
| **Deal** | A price offer for a digital game at a specific store. Contains current price, retail price (MSRP), savings percentage, deal rating, and a deep link URL. Ingested from CheapShark API. | "offer", "sale", "discount" | Immutable after ingestion. New price = new Deal row. Stored in `deals` table. |
| **Game** | A digital video game title identified primarily by CheapShark ID. Has metadata: title, developer, publisher, platform(s), genre(s), Metacritic score, Steam rating, thumbnail URL. | "product", "item", "SKU" | Canonical source is CheapShark. No manual CRUD — synced from API. Stored in `games` table. |
| **Store** | A digital game storefront where deals are listed. Includes official platforms (Steam, Epic, GOG, Humble) and keyshops (Eneba, Kinguin, Gamivo, CDKeys). Each store has an affiliate configuration for revenue tracking. | "retailer", "vendor", "shop" | Represented by numeric storeId (1–104). Only digital stores — no physical retail. See `affiliateConfig` for full list. |
| **Price History** | A time-series record of a game's price at a specific store at a point in time. Used to compute historical lows, price trends, and alert triggers. | "price log", "price snapshot" | Stored in `price_history` table. Append-only — never mutated. TimescaleDB hypertable for efficient range queries. |
| **Alert** | A user-defined price threshold for a game (optionally scoped to a store). When the current deal price drops below `targetPrice`, the user is notified. | "price alert", "notification rule" | Unique per user-game pair. Stored in `price_alerts` table. Checked by cron every 4 hours. |
| **Wishlist** | A user's personal set of games they want to track. Each entry is a (user, game) pair. Used for price monitoring and personalized recommendations. | "watchlist", "favorites", "saved games" | One wishlist per user — rows in `wishlists` table. Synced between localStorage (Zustand) and Supabase (Drizzle). |
| **Affiliate Link** | A tracked URL that redirects users to a store checkout with affiliate parameters appended. Generates revenue when a purchase is completed. | "referral link", "tracking URL", "partner link" | Generated on-the-fly from `affiliateConfig`. Validated through `/out/[storeId]/[slug]` route. Clicks logged in `affiliate_clicks`. |
| **Bundle** | A multi-game package sold at a single price, typically from Humble Bundle or Fanatical. Contains multiple games, a total value, an expiry date, and a tier (e.g., "BTA" — Beat The Average). | "pack", "multi-pack", "game pack" | Displayed on `/bundles` page. Data sourced from `BUNDLES` constant (manually curated). |
| **Collection** | A curated set of games grouped by theme or criteria (e.g., "Best RPGs", "Under $10"). Static, editorially defined. Not user-generated. | "category", "genre list", "featured" | Defined in `COLLECTIONS` constant. Rendered at `/collections/[slug]`. One game can appear in multiple collections. |
| **Historical Low** | The lowest price ever recorded for a game at a specific store. Computed by querying `price_history` for the minimum price per game-store pair. | "all-time low", "best price ever" | Immutable historical fact — may be lower than the current deal price. Used as a deal-quality signal. |
| **Keyshop** | A third-party marketplace that sells game keys sourced from other regions or promotions. Distinguished from official stores by having no direct publisher relationship. | "grey market", "reseller", "key reseller" | Examples: Eneba, Kinguin, Gamivo, CDKeys. Included for price completeness — users choose whether to filter them out. |
| **Deal Rating** | A composite score (0.0–10.0) indicating deal quality. Combines savings percentage, Metacritic score, Steam rating, store reputation, and historical low proximity. | "score", "quality", "rank" | Stored as `dealRating` on the Deal. Higher is better. Recalculated periodically by cron. |
| **Playlist** | A user-created, named list of games with an optional description. Can be public (shareable via URL) or private. Extends the wishlist concept with organization and sharing. | "collection", "game list", "folder" | Stored in `playlists` + `playlist_games` tables. Each user can have multiple playlists. Unique slug per user. |
| **Profile** | A user's public identity linked to Supabase auth. Contains username, avatar URL, role, and XP score. | "account", "user record" | Stored in `profiles` table. FK to `auth.users` via SQL, not Drizzle-level. Roles: user, mod, admin. |
| **Gamification** | A system of XP points and badges awarded for user engagement actions (tracking deals, creating playlists, referring friends). | "loyalty", "rewards", "points" | Not a single entity — spans `badges`, `user_badges`, `activities` tables. Badges have rarity tiers and JSON criteria. |

## Actors

| Actor | Definition | Interactions |
|-------|------------|--------------|
| **User** | An authenticated person who browses deals, manages wishlists, sets price alerts, creates playlists, and earns badges. Identified by Supabase auth UID. | Views deals → adds to wishlist → sets alerts → clicks affiliate links → earns XP/badges |
| **Cron** | An automated, scheduled process that ingests data, synchronizes indexes, and triggers notifications. Runs on Vercel Cron Jobs. No human interaction. | Ingest prices → reindex Typesense → check alerts → recalculate deal ratings |
| **Admin** | A system operator with elevated privileges (`role = 'admin'`). Manages collections, reviews affiliate data, configures system parameters. | Curates collections, manages users, monitors affiliate performance, audits system health |

## Relationships

```
Game       1──N──> Deal              (one game has many price offers across stores)
Deal        N──1──> Store            (each deal is at exactly one digital storefront)
Deal        N──1──> Game             (each deal is for exactly one game)
PriceHistory N──1──> Game            (many price records per game)
PriceHistory N──1──> Store           (many price records per store)
User        1──N──> Alert            (many alerts per user)
Alert       1──1──> Game             (each alert targets one game)
User        1──N──> WishlistEntry    (many wishlist entries per user)
WishlistEntry 1──1──> Game           (each entry tracks one game)
User        1──N──> Playlist         (many playlists per user)
Playlist    N──N──> Game             (many-to-many via playlist_games join table)
AffiliateLink N──1──> Store          (each affiliate link belongs to one store)
Store       1──N──> AffiliateLink    (one store can have multiple link variants)
User        1──1──> Profile          (each auth user has exactly one profile)
Bundle      N──N──> Game             (a bundle contains multiple games; a game can be in multiple bundles)
Collection  N──N──> Game             (editorially curated; a game belongs to many collections)
```

## Flagged Ambiguities

| Term | Ambiguity | Resolution |
|------|-----------|------------|
| **"Price"** | Could mean current deal price, retail (MSRP) price, or historical recorded price. In casual conversation, "price" is overloaded across three distinct domain concepts. | Qualify explicitly: `deal.price` = current offer, `deal.retailPrice` = manufacturer's suggested retail, `priceHistory.price` = snapshot value at a past time. When writing specs, never use bare "price". |
| **"Store"** | Could mean physical retail location vs. digital storefront. The game deals domain is 100% digital, but external stakeholders may conflate with brick-and-mortar. Also confusable: official publisher storefronts (Steam, Epic) vs. keyshops (Eneba, Kinguin) — both are "stores" in our model but differ in business model. | Always prefix as "digital storefront" in external docs. In code, `storeId` is the canonical reference. Distinguish "official store" vs. "keyshop" via store reputation metadata when needed. |
| **"Rating"** | Could mean Metacritic critic score, Steam user rating, or our own composite Deal Rating. Three distinct scoring systems, all called "rating" in common speech. | Metacritic = `metacriticScore` (critic). Steam = `steamRating` (user). Our composite = `dealRating` (algorithmic). Never abbreviate to just "rating" in code or documentation. |
| **"Wishlist" / "Playlist"** | Both are user-created lists of games. A new user might call their playlist a "wishlist" or vice versa. The distinction (one wishlist per user vs. multiple named playlists) is a system constraint, not naturally obvious. | Wishlist = singleton, system-defined, price-tracking focused. Playlist = user-named, shareable, organizational. The UI should explicitly distinguish these roles. |
