---
title: Database Schema
type: reference
status: active
scope: project
tags:
  - database
  - schema
  - drizzle
  - supabase
related:
  - adr/ADR-009-price-history-storage
  - adr/ADR-004-auth-backend
  - adr/ADR-007-gamification-system
updated: "2026-06-21"
---

# Database Schema

**Last updated:** 2026-06-21  
**Database:** PostgreSQL (Supabase)  
**ORM:** Drizzle ORM  
**Migration status:** 10 SQL migrations in `drizzle/`

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │    games     │       │ price_alerts │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │◄──────│ gameId (FK)  │
│ username     │       │ cheapsharkId │       │ userId       │
│ avatarUrl    │       │ title        │       │ targetPrice  │
│ role         │       │ developer    │       │ storeId      │
│ xp           │       │ publisher   │       │ isActive     │
│ createdAt    │       │ platform     │       │ currentPrice │
└──────────────┘       │ genre        │       │ createdAt    │
                       │ metacritic   │       └──────────────┘
                       │ steamRating  │
                       │ thumbUrl     │       ┌──────────────┐
                       │ createdAt    │       │    deals     │
                       └──────┬───────┤       ├──────────────┤
                              │       │       │ id (PK)      │
              ┌───────────────┼───────┼──┐    │ gameId (FK)  │
              │               │       │  │    │ storeId      │
              ▼               ▼       │  │    │ price        │
       ┌──────────┐  ┌──────────────┐ │  │    │ retailPrice  │
       │  price   │  │ notifications│ │  │    │ savings      │
       │  history │  ├──────────────┤ │  │    │ dealRating   │
       ├──────────┤  │ id (PK)      │ │  │    │ url          │
       │ id (PK)  │  │ userId       │ │  │    │ createdAt    │
       │ gameId(FK)│ │ kind         │ │  │    └──────────────┘
       │ storeId  │  │ title        │ │  │
       │ price    │  │ body         │ │  │    ┌──────────────┐
       │ retail   │  │ payload      │ │  │    │  playlists   │
       │ recorded │  │ readAt       │ │  │    ├──────────────┤
       └──────────┘  │ createdAt    │ │  │    │ id (PK)      │
                     └──────────────┘ │  │    │ userId       │
                                      │  │    │ title        │
                     ┌──────────────┐ │  │    │ slug         │
                     │  affiliate   │ │  │    │ description  │
                     │  _clicks     │ │  │    │ isPublic     │
                     ├──────────────┤ │  │    │ createdAt    │
                     │ id (PK)      │ │  │    └──────┬───────┘
                     │ storeId      │ │  │           │
                     │ gameSlug     │ │  │           │
                     │ userId       │ │  │    ┌──────▼───────┐
                     │ ip           │ │  │    │ playlist     │
                     │ timestamp    │ │  │    │ _games       │
                     └──────────────┘ │  │    ├──────────────┤
                                      │  │    │ id (PK)      │
                     ┌──────────────┐ │  │    │ playlistId(FK)
                     │  affiliate   │ │  │    │ gameId       │
                     │  _links      │ │  │    │ notes        │
                     ├──────────────┤ │  │    │ addedAt      │
                     │ id (PK)      │ │  │    └──────────────┘
                     │ storeId      │ │  │
                     │ gameSlug     │ │  │
                     │ network      │ │  │
                     │ url          │ │  │
                     └──────────────┘ │  │
                                      │  │
         ┌────────────────────────────┘  │
         │  ┌────────────────────────────┘
         ▼  ▼
    (Supabase auth.users — managed by Supabase, not in Drizzle schema)
```

## Tables

### profiles

User profiles linked to Supabase Auth.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK (matches `auth.users.id`) |
| `username` | `varchar(100)` | |
| `avatarUrl` | `varchar(500)` | |
| `role` | `user_role` enum | `'user'`, `'mod'`, `'admin'` |
| `xp` | `integer` | Default 0 |
| `createdAt` | `timestamp` | Default `now()` |

### games

Cached CheapShark game data.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `cheapsharkId` | `varchar(50)` | UNIQUE, NOT NULL |
| `title` | `varchar(255)` | NOT NULL |
| `alternativeTitles` | `varchar(255)[]` | |
| `developer` | `varchar(100)` | |
| `publisher` | `varchar(100)` | |
| `platform` | `varchar(50)[]` | |
| `genre` | `varchar(50)[]` | |
| `metacriticScore` | `integer` | |
| `steamRating` | `real` | |
| `thumbUrl` | `varchar(500)` | |
| `createdAt` | `timestamp` | Default `now()` |
| `updatedAt` | `timestamp` | Default `now()` |

**Indexes**: `games_cheapsharkId_idx` on `cheapsharkId`

### deals

Current deals per game+store. Idempotent upsert via `ON CONFLICT`.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `gameId` | `uuid` | FK → games.id, NOT NULL |
| `storeId` | `varchar(50)` | NOT NULL |
| `price` | `real` | NOT NULL |
| `retailPrice` | `real` | NOT NULL |
| `savings` | `real` | NOT NULL |
| `dealRating` | `real` | |
| `url` | `varchar(2000)` | |
| `createdAt` | `timestamp` | Default `now()` |

**Indexes**: `deals_gameId_idx`, `deals_store_game_idx`, `deals_rating_idx`, `deals_game_store_price_idx`
**Unique**: `deals_game_store_unique` ON `(gameId, storeId)` — prevents duplicates

### price_history

Time-series price snapshots per game+store. Appended on each cron run.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `gameId` | `uuid` | FK → games.id, NOT NULL |
| `storeId` | `varchar(50)` | NOT NULL |
| `price` | `real` | NOT NULL |
| `retailPrice` | `real` | NOT NULL |
| `recordedAt` | `timestamp` | Default `now()` |

**Indexes**: `ph_game_store_recorded_idx` ON `(gameId, storeId, recordedAt DESC)`

### price_alerts

User-configured price alerts.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `userId` | `uuid` | NOT NULL (FK to `auth.users`) |
| `gameId` | `uuid` | FK → games.id, NOT NULL |
| `targetPrice` | `real` | NOT NULL |
| `storeId` | `varchar(50)` | |
| `isActive` | `integer` | Default 1 |
| `currentPrice` | `real` | Updated by cron |
| `lastCheckedAt` | `timestamp` | |
| `createdAt` | `timestamp` | Default `now()` |

**Unique**: `pa_user_game_unique` ON `(userId, gameId)`
**Indexes**: `pa_active_game_idx` ON `(isActive, gameId) WHERE isActive = 1`

### notifications

In-app notification feed.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `userId` | `uuid` | NOT NULL |
| `kind` | `varchar(50)` | NOT NULL (`price_alert`, `deal`, etc.) |
| `title` | `varchar(255)` | NOT NULL |
| `body` | `text` | |
| `payload` | `jsonb` | Flexible metadata |
| `readAt` | `timestamp` | |
| `createdAt` | `timestamp` | Default `now()` |

**Indexes**: `notifications_user_created_idx` ON `(userId, createdAt)`

### playlists + playlist_games

User-created game lists.

**playlists:**

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `userId` | `uuid` | NOT NULL |
| `title` | `varchar(255)` | NOT NULL |
| `slug` | `varchar(255)` | NOT NULL |
| `description` | `varchar(500)` | |
| `isPublic` | `boolean` | Default false |
| `createdAt` | `timestamp` | Default `now()` |
| `updatedAt` | `timestamp` | Default `now()` |

**Unique**: `pl_user_slug_unique` ON `(userId, slug)`

**playlist_games:**

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default random |
| `playlistId` | `uuid` | FK → playlists.id, NOT NULL |
| `gameId` | `uuid` | NOT NULL |
| `notes` | `varchar(500)` | |
| `addedAt` | `timestamp` | Default `now()` |

**Unique**: `pg_playlist_game_unique` ON `(playlistId, gameId)`

### affiliate_links + affiliate_clicks

Affiliate monetization tracking.

**affiliate_links:**

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `storeId` | `varchar(50)` | NOT NULL |
| `gameSlug` | `varchar(255)` | NOT NULL |
| `network` | `varchar(50)` | NOT NULL |
| `url` | `varchar(2000)` | NOT NULL |
| `trackingTemplate` | `varchar(2000)` | |
| `updatedAt` | `timestamp` | Default `now()` |

**affiliate_clicks:**

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `storeId` | `varchar(50)` | NOT NULL |
| `gameSlug` | `varchar(255)` | NOT NULL |
| `userId` | `uuid` | |
| `ip` | `varchar(45)` | |
| `timestamp` | `timestamp` | Default `now()` |

**Indexes**: `ac_timestamp_idx` ON `timestamp`

## Relationships

| From | To | Type | On |
|------|-----|------|-----|
| `deals.gameId` | `games.id` | FK | CASCADE (implicit) |
| `price_alerts.gameId` | `games.id` | FK | CASCADE |
| `price_history.gameId` | `games.id` | FK | CASCADE |
| `playlist_games.playlistId` | `playlists.id` | FK | CASCADE |
| `price_alerts.userId` | `auth.users.id` | Logical | Via Supabase RLS |
| `profiles.id` | `auth.users.id` | Logical | Supabase trigger sync |
| `playlists.userId` | `auth.users.id` | Logical | Via RLS |
| `notifications.userId` | `auth.users.id` | Logical | Via RLS |

## SQL Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `check_alerts_for_all()` | Migration 0005/0010 | CTE-based alert checking (set processing) |
| `pg_advisory_xact_lock(bigint)` | Migration 0010 | 64-bit advisory lock for alert dedup |

## Migrations

See `drizzle/*.sql` for migration history. Key migrations:

| # | File | Change |
|---|------|--------|
| 0009 | `0009_schema_optimization.sql` | Index additions (CONCURRENTLY) |
| 0010 | `0010_optimize_check_alerts.sql` | 64-bit lock conversion |
| 0012 | (Sprint 3) | deals unique index `(gameId, storeId)` |

---

## Relações

- [ADR-009](../adr/ADR-009-price-history-storage.md) — Decisão original para TimescaleDB + price history storage
- [ADR-004](../adr/ADR-004-auth-backend.md) — Supabase Auth + Drizzle ORM
- [ADR-007](../adr/ADR-007-gamification-system.md) — Badges, XP, playlists schema
- [runbook.md](../runbook.md) — Playbooks para DB pool exhaustion e migrations
- [supabase_setup_guide.md](../supabase_setup_guide.md) — Setup local + RLS policies
