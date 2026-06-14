# API Reference

> Internal API reference for GameDeals cron endpoints and Server Actions.
> Source file paths referenced for each endpoint/function.

---

## Cron Endpoints

All cron endpoints are protected by `CRON_SECRET` header validation. Deployed as Vercel Cron Jobs.

**Auth (all cron endpoints):**
```
Authorization: Bearer ${CRON_SECRET}
```
Response `401` if missing or invalid.

---

### `GET /api/cron/ingest-prices`

**Source:** `src/app/api/cron/ingest-prices/route.ts`

Runs every 4 hours. Fetches top 100 on-sale deals from CheapShark API and persists to database.

**Auth:** `CRON_SECRET`

**Response `200`:**
```json
{
  "success": true,
  "dealsIngested": 100,
  "gamesUpserted": 90,
  "pricesRecorded": 100
}
```

**Response `401`:**
```json
{ "error": "Unauthorized" }
```

**Response `500` (CheapShark down):**
```json
{
  "success": false,
  "dealsIngested": 0,
  "gamesUpserted": 0,
  "pricesRecorded": 0,
  "error": "CheapShark API error: 503"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://game-deals.vercel.app/api/cron/ingest-prices
```

**Implementation:**

| Step | Detail |
|------|--------|
| 1 | Validate `Authorization: Bearer` against `CRON_SECRET` env |
| 2 | Fetch `GET https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100` |
| 3 | Upsert games into `games` table (keyed by `cheapsharkId`) |
| 4 | Batch insert deals into `deals` table |
| 5 | Batch insert (50/50) price snapshots into `price_history` |
| 6 | Return result summary |

**Tables affected:** `games`, `deals`, `price_history`
**Source action:** `ingestPricesAction()` in `src/actions/deals.ts`
**External dependency:** CheapShark API (`cheapshark.com/api/1.0`)

---

### `GET /api/cron/reindex-typesense`

**Source:** `src/app/api/cron/reindex-typesense/route.ts`

Runs daily. Fetches deals from CheapShark and batch-indexes into Typesense collection.

**Auth:** `CRON_SECRET`

**Response `200`:**
```json
{
  "success": true,
  "indexed": 100
}
```

**Response `401`:**
```json
{ "error": "Unauthorized" }
```

**Response `500` (Typesense not configured):**
```json
{
  "success": false,
  "indexed": 0,
  "error": "Typesense not configured"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://game-deals.vercel.app/api/cron/reindex-typesense
```

**Implementation:**

| Step | Detail |
|------|--------|
| 1 | Validate `Authorization: Bearer` against `CRON_SECRET` env |
| 2 | Fetch `GET https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100` |
| 3 | Map deals to Typesense document shape (`gameID`, `title`, `thumb`, `cheapest`, `metacriticScore`, `steamRating`) |
| 4 | Batch upsert via `POST /collections/games/documents/import?action=upsert` (JSONL format) |
| 5 | Return indexed count |

**Source action:** `syncGamesToTypesenseAction()` in `src/actions/search.ts`
**External dependencies:** CheapShark API, Typesense

---

### `GET /api/cron/check-alerts`

**Source:** `src/app/api/cron/check-alerts/route.ts`

Checks all active price alerts against current deal prices in database. Calls `checkTriggeredAlertsAction()` which executes the `check_alerts_for_all()` SECURITY DEFINER SQL function. Logs triggered alerts to console, inserts notifications into `notifications` table.

**Auth:** via `verifyCronAuth()` in `src/lib/cron-auth.ts`

**Response `200` (alerts triggered):**
```json
{
  "processed": 5,
  "triggered": 2,
  "details": [
    { "userId": "uuid-1", "gameId": "uuid-2", "currentLowest": 4.99, "targetPrice": 9.99, "notificationId": "uuid-3" }
  ]
}
```

**Response `200` (no alerts):**
```json
{ "processed": 0, "triggered": 0, "details": [] }
```

**Response `401`:**
```json
{ "error": "Unauthorized" }
```

**Response `500`:**
```json
{ "error": "Internal error checking alerts" }
```

**Example:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://game-deals.vercel.app/api/cron/check-alerts
```

**Implementation:**

| Step | Detail |
|------|--------|
| 1 | Validate `Authorization` via `verifyCronAuth()` shared helper |
| 2 | `checkTriggeredAlertsAction()` counts active alerts (`SELECT COUNT(*)`) |
| 3 | Executes `SELECT * FROM public.check_alerts_for_all()` (SECURITY DEFINER) |
| 4 | SQL function iterates active alerts: acquires `pg_advisory_xact_lock`, queries `MIN(deals.price)`, updates `price_alerts.currentPrice`/`lastCheckedAt`, inserts notification into `notifications` with 1h idempotency window |
| 5 | Only triggered alerts returned; logged with userId/gameId/price/target |
| 6 | Returns `{ processed, triggered, details }` |

**Tables affected:** `price_alerts` (writes `currentPrice`, `lastCheckedAt`), `notifications` (inserts triggered alerts)
**External dependency:** None (uses local DB prices, not CheapShark API)

---

## Server Actions

All Server Actions use the `'use server'` directive and are importable from `@/actions/*`.

---

### `src/actions/deals.ts`

Thin wrappers over CheapShark API. Validation, fallback, and DB persistence.

**Shared helpers** (exported from `src/services/fetch-helpers.ts`):
- `fetchDealsWithFallback(url)` — fetch with `next.revalidate=3600`, falls back to `fallbackDeals` on error/empty
- `fetchGameDetails(id)` — fetch game details from CheapShark, returns `null` on error

**UUID resolver functions:**
- `resolveGameUuid(cheapsharkId)` — calls `resolve_game_uuid()` RPC, returns UUID or `null`
- `resolveGameUuidsAction(ids)` — batch cheapsharkId → UUID via `SELECT` on `games` table
- `resolveCheapsharkByUuidAction(uuid)` — reverse lookup via `resolve_cheapshark_id()` RPC
- `resolveCheapsharkByUuidsAction(uuids)` — batch UUID → cheapsharkId

---

#### `getDealsAction`

```ts
async function getDealsAction(params?: {
  sortBy?: string;     // 'Deal Rating' | 'Title' | 'Savings' | 'Price' (default: 'Deal Rating')
  onSale?: string;     // '0' | '1' (default: '1')
  pageSize?: string;   // 1-100 (default: '20')
  upperPrice?: string; // numeric string
  lowerPrice?: string; // numeric string
  storeID?: string;    // 1-3 digit numeric string
  title?: string;      // max 200 chars
}): Promise<Deal[]>
```

Fetches deals from CheapShark with validated params. Falls back to `fallbackDeals` on network error or empty response. Uses `next.revalidate = 3600`.

**Type reference:** `Deal` from `src/types/game.ts`
```ts
interface Deal {
  internalName: string;
  title: string;
  metacriticLink: string;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}
```

**Example:**
```ts
import { getDealsAction } from '@/actions/deals';

const deals = await getDealsAction({
  sortBy: 'Price',
  pageSize: '10',
  upperPrice: '20',
});
```

---

#### `getGameAction`

```ts
async function getGameAction(id: string): Promise<GameDetails | null>
```

Fetches full game details with deals from CheapShark by game ID. Uses `next.revalidate = 3600`. Returns `null` on 404 or network error.

**Type reference:** `GameDetails`, `GameDeal`, `GameInfo`, `LowestPrice` from `src/types/game.ts`
```ts
interface GameInfo {
  title: string;
  steamAppID: string | null;
  thumb: string;
}
interface LowestPrice {
  price: string;
  date: number;
}
interface GameDeal {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
  dealRating: string;
}
interface GameDetails {
  info: GameInfo;
  cheapestPriceEver: LowestPrice;
  deals: GameDeal[];
}
```

**Example:**
```ts
import { getGameAction } from '@/actions/deals';

const game = await getGameAction('612');
if (game) {
  console.log(game.info.title, game.deals.length);
}
```

---

#### `getStoresAction`

```ts
async function getStoresAction(): Promise<Record<string, string>>
```

Fetches store list from CheapShark API. Merges grey-market stores (ID >= 100): CDKeys (101), Kinguin (102), Eneba (103), Gamivo (104). Uses `next.revalidate = 86400`.

**Example:**
```ts
import { getStoresAction } from '@/actions/deals';

const stores = await getStoresAction();
// { "1": "Steam", "101": "CDKeys", ... }
```

---

#### `ingestPricesAction`

```ts
async function ingestPricesAction(): Promise<{
  success: boolean;
  dealsIngested: number;
  gamesUpserted: number;
  pricesRecorded: number;
  error?: string;
}>
```

Internal function (called by cron). Fetches top 100 on-sale deals from CheapShark, upserts games into `games` table (by `cheapsharkId`), inserts deals into `deals` table, and records price snapshots into `price_history` in batches of 50.

**Tables affected:** `games`, `deals`, `price_history`
**Used by:** `GET /api/cron/ingest-prices`

---

#### `getDailyPriceHistoryAction`

```ts
async function getDailyPriceHistoryAction(
  cheapsharkId: string,  // CheapShark numeric ID
  days?: number           // default: 90
): Promise<unknown>
```

Resolves `cheapsharkId` → UUID via `resolveGameUuid()`, then calls PostgreSQL function `get_daily_prices(uuid, days)`. Returns `[]` if game not in DB or on error.

---

#### `getWeeklyPriceHistoryAction`

```ts
async function getWeeklyPriceHistoryAction(
  cheapsharkId: string,  // CheapShark numeric ID
  weeks?: number          // default: 26
): Promise<unknown>
```

Resolves `cheapsharkId` → UUID via `resolveGameUuid()`, then calls PostgreSQL function `get_weekly_prices(uuid, weeks)`. Returns `[]` if game not in DB or on error.

---

#### `getDealsFromDBAction`

```ts
async function getDealsFromDBAction(
  limit?: number  // default: 20
): Promise<Array<{
  gameId: string;
  title: string;
  storeId: string;        // varchar(50) — replaces old pgEnum
  price: number;
  retailPrice: number;
  savings: number;
  dealRating: number | null;
  thumbUrl: string | null;
}>>
```

Queries `deals` table joined with `games`, ordered by `dealRating` DESC. Returns locally-persisted deals from database.

---

### `src/actions/search.ts`

Typesense search with CheapShark fallback. Collection setup and sync.

---

#### `searchGamesAction`

```ts
async function searchGamesAction(
  query: string,
  limit?: number  // default: 10
): Promise<Array<{
  gameID: string;
  external: string;    // title from document
  thumb: string;
  cheapest: string;
}> | Array<Record<string, string>>>
```

Searches Typesense collection (`q` query, fields: `title,developer,publisher` with weights `100,50,50`, typo tolerance on, split-join tokens). Falls back to CheapShark `GET /api/1.0/games?title={query}&limit={limit}` if no Typesense API key configured.

Returns empty array on search error.

---

#### `syncGamesToTypesenseAction`

```ts
async function syncGamesToTypesenseAction(): Promise<{
  success: boolean;
  indexed: number;
  error?: string;
}>
```

Called by cron (reindex-typesense). Fetches 100 on-sale deals from CheapShark, maps to Typesense documents (`gameID`, `title`, `thumb`, `cheapest`, `metacriticScore`, `steamRating`), and batch-upserts via `indexGamesBatch()`.

Returns `{ success: false, indexed: 0, error: 'Typesense not configured' }` if no admin key set.

**Used by:** `GET /api/cron/reindex-typesense`

---

#### `createTypesenseCollectionAction`

```ts
async function createTypesenseCollectionAction(): Promise<boolean>
```

Creates Typesense collection named by `TYPESENSE_COLLECTION_NAME` env var using `GAME_SCHEMA` from `src/lib/typesense.ts`. Safe to call multiple times — returns `true` on `409` (already exists).

**Schema fields:**
| Field | Type | Facet |
|-------|------|-------|
| `gameID` | `string` | no |
| `title` | `string` | no |
| `thumb` | `string` | no |
| `cheapest` | `string` | no |
| `cheapestPrice` | `float` | no |
| `metacriticScore` | `int32` (optional) | no |
| `steamRating` | `int32` (optional) | no |
| `developer` | `string` (optional) | yes |
| `publisher` | `string` (optional) | yes |
| `genre` | `string[]` (optional) | yes |
| `platform` | `string[]` (optional) | yes |

Default sort: `cheapestPrice:asc`.

---

### `src/actions/alerts.ts`

Price alert CRUD with Supabase auth enforcement. Uses Drizzle ORM singleton (`db.execute(sql`).

All functions now resolve `gameId` (CheapShark numeric ID) to internal UUID via `resolveGameUuid()` before database operations.

---

#### `createPriceAlertAction`

```ts
async function createPriceAlertAction(
  gameId: string,      // CheapShark numeric ID (e.g. "612")
  targetPrice: number,
  storeId?: string
): Promise<Record<string, unknown>>
```

Creates a price alert for the authenticated user. Resolves `cheapsharkId` → UUID via `resolveGameUuid()`. Upserts on conflict (`userId`, `gameId`). Requires valid Supabase session.

**Throws:** `Error('Unauthorized')` if no session.
**Throws:** `Error('Game not found or not yet ingested')` if cheapsharkId not in DB.

**Tables affected:** `price_alerts`

**Example:**
```ts
import { createPriceAlertAction } from '@/actions/alerts';

await createPriceAlertAction('612', 9.99, '1');
```

---

#### `getUserAlertsAction`

```ts
async function getUserAlertsAction(): Promise<Array<Record<string, unknown>>>
```

Returns active alerts for the authenticated user, joined with `games` table for `title` and `thumbUrl`. Returns `[]` if not authenticated.

**Tables affected:** `price_alerts`, `games`

---

#### `deletePriceAlertAction`

```ts
async function deletePriceAlertAction(
  alertId: string
): Promise<boolean>
```

Deletes a price alert. Verifies ownership (alert's `userId` must match current session user).

**Throws:** `Error('Unauthorized')` if no session.
**Throws:** `Error('Forbidden')` if alert belongs to another user.

**Tables affected:** `price_alerts`

---

#### `checkTriggeredAlertsAction`

```ts
async function checkTriggeredAlertsAction(): Promise<{
  checked: number;    // total active alerts processed
  triggered: Array<{
    userId: string;
    gameId: string;
    storeId?: string;
    targetPrice: number;
    currentLowest: number;
    notificationId?: string;
  }>;
}>
```

Calls the `check_alerts_for_all()` SECURITY DEFINER SQL function which handles:
- `pg_advisory_xact_lock(hashtext(userId:gameId:targetPrice))` for race-free processing
- `UPDATE price_alerts SET currentPrice, lastCheckedAt` for each active alert
- `INSERT INTO notifications` with 1h idempotency window per (userId, gameId, targetPrice)
- Returns only alerts where currentLowest ≤ targetPrice

The `checked` count is obtained via `SELECT COUNT(*) FROM price_alerts WHERE "isActive" = 1` before the function call.

**Tables affected:** `price_alerts` (writes `currentPrice`, `lastCheckedAt`), `notifications` (inserts)
**Used by:** `GET /api/cron/check-alerts`

---

### `src/actions/notifications.ts`

**Source:** `src/actions/notifications.ts`

In-app notification delivery for price alerts. Uses Drizzle ORM with raw SQL. All functions require Supabase auth session.

---

#### `getNotificationsAction`

```ts
async function getNotificationsAction(
  limit?: number  // default: 20
): Promise<{
  items: Array<typeof notifications.$inferSelect>;
  unread: number;
}>
```

Single-roundtrip CTE: fetches recent notifications + unread count in one query. Returns `{ items: [], unread: 0 }` if not authenticated. Ordered by `createdAt` DESC.

**Tables affected:** `notifications`

---

#### `markNotificationReadAction`

```ts
async function markNotificationReadAction(id: string): Promise<void>
```

Marks a single notification as read (`readAt = NOW()`). Verifies ownership via `userId` filter.

**Throws:** `Error('Unauthorized')` if no session.
**Tables affected:** `notifications`

---

#### `markAllNotificationsReadAction`

```ts
async function markAllNotificationsReadAction(): Promise<void>
```

Marks all unread notifications for the current user as read. Calls `revalidatePath('/')`.

**Throws:** `Error('Unauthorized')` if no session.
**Tables affected:** `notifications`

---

### `src/actions/playlists.ts`

Playlist CRUD with ownership enforcement. Uses direct `postgres` connection.

---

#### `createPlaylistAction`

```ts
async function createPlaylistAction(
  title: string,
  description: string,
  isPublic?: boolean  // default: false
): Promise<Record<string, unknown>>
```

Creates a new playlist for the authenticated user. Auto-generates URL-safe slug from title (lowercased, non-alphanumeric replaced with `-`, trimmed).

**Throws:** `Error('Unauthorized')` if no session.

**Tables affected:** `playlists`

**Example:**
```ts
import { createPlaylistAction } from '@/actions/playlists';

await createPlaylistAction('My Favorites', 'Best RPGs', true);
```

---

#### `getUserPlaylistsAction`

```ts
async function getUserPlaylistsAction(): Promise<Array<Record<string, unknown>>>
```

Returns playlists for the authenticated user with game count (LEFT JOIN `playlist_games`). Ordered by `createdAt` DESC. Returns `[]` if not authenticated.

---

#### `addGameToPlaylistAction`

```ts
async function addGameToPlaylistAction(
  playlistId: string,
  gameId: string,
  notes?: string
): Promise<Record<string, unknown> | null>
```

Adds a game to a playlist. Verifies playlist ownership. Silently ignores duplicates (`ON CONFLICT DO NOTHING`).

**Throws:** `Error('Unauthorized')` if no session.
**Throws:** `Error('Forbidden')` if playlist not owned by current user.

**Tables affected:** `playlist_games`

---

#### `removeGameFromPlaylistAction`

```ts
async function removeGameFromPlaylistAction(
  playlistId: string,
  gameId: string
): Promise<boolean>
```

Removes a game from a playlist. Verifies playlist ownership.

**Throws:** `Error('Unauthorized')` if no session.
**Throws:** `Error('Forbidden')` if playlist not owned by current user.

**Tables affected:** `playlist_games`

---

#### `deletePlaylistAction`

```ts
async function deletePlaylistAction(
  playlistId: string
): Promise<boolean>
```

Deletes a playlist (cascading deletes `playlist_games`). Verifies ownership.

**Throws:** `Error('Unauthorized')` if no session.
**Throws:** `Error('Forbidden')` if playlist not owned by current user.

**Tables affected:** `playlists`

---

#### `getPublicPlaylistAction`

```ts
async function getPublicPlaylistAction(
  slug: string
): Promise<{
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  games: Array<Record<string, unknown>>;
} | null>
```

Fetches a public playlist by slug with its games (joined with `games` table). Returns `null` if not found or not public. No auth required.

---

### `src/actions/gamification.ts`

XP, badges, and achievements. Uses Drizzle ORM `db.execute` with raw SQL.

---

#### `addXPAction`

```ts
async function addXPAction(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean>
```

Adds XP to user's profile (upsert on `id`). Logs activity to `activities` table with `actionType = reason` and `details = { xp: amount }`.

**Tables affected:** `profiles`, `activities`

**Example:**
```ts
import { addXPAction } from '@/actions/gamification';

await addXPAction('user-uuid', 50, 'wishlist_add');
```

---

#### `getUserXPAction`

```ts
async function getUserXPAction(
  userId: string
): Promise<number>
```

Returns total XP for user. Returns `0` if no profile row exists.

**Tables affected:** `profiles`

---

#### `getBadgesAction`

```ts
async function getBadgesAction(): Promise<unknown>
```

Returns all badges from `badges` table, ordered by name.

**Tables affected:** `badges`

---

#### `getUserBadgesAction`

```ts
async function getUserBadgesAction(
  userId: string
): Promise<unknown>
```

Returns user's awarded badges with `awardedAt` timestamp, ordered by `awardedAt` DESC.

**Tables affected:** `user_badges`, `badges`

---

#### `awardBadgeAction`

```ts
async function awardBadgeAction(
  userId: string,
  badgeId: string
): Promise<boolean>
```

Grants a badge to a user. Idempotent — `ON CONFLICT DO NOTHING`. Returns `true` if badge was granted (new row inserted), `false` if already owned.

**Tables affected:** `user_badges`

---

#### `checkAndAwardBadgesAction`

```ts
async function checkAndAwardBadgesAction(
  userId: string
): Promise<boolean>
```

Evaluates user stats and auto-awards milestone badges:

| Badge | Criteria |
|-------|----------|
| `First Steps` | `xp > 0` |
| `XP Hunter` | `xp >= 100` |
| `Wishlist Master` | `wishlistCount >= 10` |
| `Curator` | `playlistCount >= 5` |

Checks `wishlists` and `playlists` tables for counts. Awards badges via `awardBadgeAction()`.

**Tables affected:** `user_badges`, `wishlists`, `playlists`

---

## Quick Reference

| Endpoint / Action | File | Auth | Purpose |
|---|---|---|---|---|
| `GET /api/cron/ingest-prices` | `src/app/api/cron/ingest-prices/route.ts` | `CRON_SECRET` | Ingest CheapShark deals → DB |
| `GET /api/cron/reindex-typesense` | `src/app/api/cron/reindex-typesense/route.ts` | `CRON_SECRET` | Reindex games → Typesense |
| `GET /api/cron/check-alerts` | `src/app/api/cron/check-alerts/route.ts` | `CRON_SECRET` | Check price alerts + insert notifications |
| `getDealsAction` | `src/actions/deals.ts` | none | Fetch deals from CheapShark |
| `getGameAction` | `src/actions/deals.ts` | none | Fetch game details |
| `getStoresAction` | `src/actions/deals.ts` | none | Fetch store list |
| `ingestPricesAction` | `src/actions/deals.ts` | none | Bulk price ingestion (UUID FK) |
| `getDailyPriceHistoryAction` | `src/actions/deals.ts` | none | Daily price history (resolves cheapsharkId→UUID) |
| `getWeeklyPriceHistoryAction` | `src/actions/deals.ts` | none | Weekly price history (resolves cheapsharkId→UUID) |
| `getDealsFromDBAction` | `src/actions/deals.ts` | none | Deals from local DB |
| `resolveGameUuid` | `src/actions/deals.ts` | none | Single cheapsharkId→UUID resolution |
| `resolveGameUuidsAction` | `src/actions/deals.ts` | none | Batch cheapsharkId→UUID resolution |
| `resolveCheapsharkByUuidAction` | `src/actions/deals.ts` | none | Single UUID→cheapsharkId resolution |
| `resolveCheapsharkByUuidsAction` | `src/actions/deals.ts` | none | Batch UUID→cheapsharkId resolution |
| `searchGamesAction` | `src/actions/search.ts` | none | Typesense / CheapShark search |
| `syncGamesToTypesenseAction` | `src/actions/search.ts` | none | Sync games → Typesense |
| `createTypesenseCollectionAction` | `src/actions/search.ts` | none | Create Typesense collection |
| `createPriceAlertAction` | `src/actions/alerts.ts` | Supabase session | Create price alert (resolves cheapsharkId→UUID) |
| `getUserAlertsAction` | `src/actions/alerts.ts` | Supabase session | List user alerts |
| `deletePriceAlertAction` | `src/actions/alerts.ts` | Supabase session | Delete alert (owner only) |
| `checkTriggeredAlertsAction` | `src/actions/alerts.ts` | none | Calls `check_alerts_for_all()` SQL function |
| `getNotificationsAction` | `src/actions/notifications.ts` | Supabase session | List notifications + unread count |
| `markNotificationReadAction` | `src/actions/notifications.ts` | Supabase session | Mark single notification read |
| `markAllNotificationsReadAction` | `src/actions/notifications.ts` | Supabase session | Mark all notifications read |
| `createPlaylistAction` | `src/actions/playlists.ts` | Supabase session | Create playlist |
| `getUserPlaylistsAction` | `src/actions/playlists.ts` | Supabase session | List user playlists |
| `addGameToPlaylistAction` | `src/actions/playlists.ts` | Supabase session | Add game to playlist |
| `removeGameFromPlaylistAction` | `src/actions/playlists.ts` | Supabase session | Remove game from playlist |
| `deletePlaylistAction` | `src/actions/playlists.ts` | Supabase session | Delete playlist (owner only) |
| `getPublicPlaylistAction` | `src/actions/playlists.ts` | none | Fetch public playlist |
| `addXPAction` | `src/actions/gamification.ts` | none | Add XP to user |
| `getUserXPAction` | `src/actions/gamification.ts` | none | Get user XP |
| `getBadgesAction` | `src/actions/gamification.ts` | none | List all badges |
| `getUserBadgesAction` | `src/actions/gamification.ts` | none | List user badges |
| `awardBadgeAction` | `src/actions/gamification.ts` | none | Grant badge to user |
| `checkAndAwardBadgesAction` | `src/actions/gamification.ts` | none | Auto-award milestone badges |

---

## Error Handling Patterns

| Scenario | Response |
|----------|----------|
| Missing/invalid `CRON_SECRET` | HTTP `401` `{ error: "Unauthorized" }` |
| CheapShark API down (cron) | HTTP `500` with error details |
| CheapShark API down (actions) | `fallbackDeals` (deal endpoints) or empty array |
| Supabase session missing (actions) | `Error('Unauthorized')` |
| Ownership violation (actions) | `Error('Forbidden')` |
| Typesense not configured (search) | Silent fallback to CheapShark API |

---

## Env Dependencies

| Variable | Used By |
|----------|---------|
| `CRON_SECRET` | All cron endpoints |
| `DATABASE_URL` | `src/db/index.ts` (singleton Drizzle pool, used by all actions) |
| `TYPESENSE_ADMIN_KEY` | `syncGamesToTypesenseAction`, `createTypesenseCollectionAction` |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | `searchGamesAction` (fallback), client-side search |
| `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL` | Typesense client config |
| `TYPESENSE_COLLECTION_NAME` | Typesense collection name (default: `games`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin operations |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase client init |
