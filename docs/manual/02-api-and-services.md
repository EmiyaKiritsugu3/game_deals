# 🌐 02. API Infrastructure and Services

This section details how GameDeals communicates with the outside world. The project's data foundation rests on three pillars: **Server Actions** (primary data layer), **TanStack Query** (client-side caching and refetch) and **cron endpoints** (scheduled data pipeline).

---

## 1. Data Architecture Overview

The data flow follows a clear hierarchy:

```
CheapShark API (external)
       │
       ▼
┌─────────────────────────────┐
│  Server Actions (src/actions/) │  ← 'use server', primary layer
│  - deals.ts                  │
│  - search.ts                 │
│  - alerts.ts                 │
│  - playlists.ts              │
│  - gamification.ts           │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│ TanStack│ │ Postgres │
│  Query  │ │ (Drizzle │
│  Hooks  │ │  + raw)  │
└────┬────┘ └──────────┘
     ▼
  React Components (client)
```

- **Server Components** call Server Actions directly in server-only contexts.
- **Client Components** use TanStack Query hooks that invoke Server Actions.
- **Cron endpoints** (`/api/cron/*`) trigger Server Actions in the background on a fixed schedule.

---

## 2. CheapShark API (`src/services/api.ts`)

The core of GameDeals is powered by the CheapShark API. The raw client in `src/services/api.ts` makes direct `fetch` calls with Next.js cache options.

### Caching Strategy (`revalidate`)

- **`getDeals()`** — `revalidate: 3600` (1 hour). Deal listings change with moderate frequency.
- **`getStores()`** — `revalidate: 86400` (24 hours). Stores rarely change.
- **`getGame()`** — `revalidate: 3600` (1 hour). Individual game details.

**Why:** The CheapShark API is strict against spam. Without aggressive Next.js caching, simultaneous accesses from hundreds of users would cause server IP blocking (HTTP 429). The cache shields the external API.

### Resilient Fallback

- `getDeals()` wrapped in `try/catch`. If `res.ok` fails, returns `fallbackDeals` (local constant in `src/data/`). The UI peacefully renders old data — no White Screen of Death.
- `getGame()` returns `null` on error; the component handles empty state.

### Grey Markets

Non-official stores (Keyshops: Kinguin, Eneba, CDKeys, Gamivo) are not natively returned by CheapShark. In `api.ts`, the `isGreyMarketStore()` heuristic maps stores with ID >= 100. The `generateGreyMarketDeals()` function injects them into detail pages for full price comparison.

### DRM and Stores

`getDrmType()` classifies stores by DRM type:

| Store | DRM |
|------|-----|
| GOG | DRM-Free |
| Epic | Epic Key |
| Origin/EA | EA App |
| Microsoft | MS Store |
| Steam | Steam Key |

---

## 3. Server Actions (`src/actions/`) — Primary Layer

All data logic that requires authentication, database access, or validation lives in Server Actions (`'use server'`). They replace traditional API route handlers as the main data layer.

### `deals.ts`

Deal fetching and ingestion functions:

| Function | Description |
|--------|-----------|
| `getDealsAction(params?)` | Fetches deals from CheapShark with parameter validation (sortBy, pageSize, upperPrice, etc). Fallback to `fallbackDeals`. |
| `getGameAction(id)` | Game details via CheapShark. |
| `getStoresAction()` | Store list with injected grey markets. |
| `ingestPricesAction()` | Ingestion pipeline: fetches 100 deals from CheapShark, upserts into `games`, inserts into `deals` and `price_history` (batches of 50). |
| `getDailyPriceHistoryAction(gameId, days)` | Daily history via PostgreSQL function `get_daily_prices()`. |
| `getWeeklyPriceHistoryAction(gameId, weeks)` | Weekly history via PostgreSQL function `get_weekly_prices()`. |
| `getDealsFromDBAction(limit)` | Deals from the database with JOIN on `games`. |

### `search.ts`

Search with Typesense → CheapShark fallback:

| Function | Description |
|--------|-----------|
| `searchGamesAction(query, limit)` | Tries Typesense first; if not configured, falls back to CheapShark `/api/1.0/games`. |
| `syncGamesToTypesenseAction()` | Syncs top 100 CheapShark deals to Typesense. Called by cron. |
| `createTypesenseCollectionAction()` | Initial Typesense collection setup (idempotent). |

### `alerts.ts`

Price alerts with authentication and raw `postgres`:

| Function | Description |
|--------|-----------|
| `createPriceAlertAction(gameId, targetPrice, storeId?)` | Creates alert. Checks auth via Supabase. Uses `ON CONFLICT` for upsert. |
| `getUserAlertsAction()` | Lists alerts for logged-in user with JOIN on `games`. |
| `deletePriceAlertAction(alertId)` | Removes alert with ownership verification. |
| `checkTriggeredAlertsAction()` | Compares current prices with alert targets. Used by cron. |

### `playlists.ts`

Playlists with ownership check:

| Function | Description |
|--------|-----------|
| `createPlaylistAction(title, description, isPublic)` | Creates playlist with auto-generated slug. |
| `getUserPlaylistsAction()` | Lists playlists with game count. |
| `addGameToPlaylistAction(playlistId, gameId, notes?)` | Adds game with ownership verification. |
| `removeGameFromPlaylistAction(playlistId, gameId)` | Removes game. |
| `deletePlaylistAction(playlistId)` | Deletes playlist. |
| `getPublicPlaylistAction(slug)` | Fetches public playlist by slug. |

### `gamification.ts`

XP and badges system:

| Function | Description |
|--------|-----------|
| `addXPAction(userId, amount, reason)` | Adds XP and logs activity. |
| `getUserXPAction(userId)` | Queries current XP. |
| `getBadgesAction()` | Lists all badges. |
| `getUserBadgesAction(userId)` | Badges earned by the user. |
| `awardBadgeAction(userId, badgeId)` | Awards badge (idempotent). |
| `checkAndAwardBadgesAction(userId)` | Checks conditions and awards automatic badges (First Steps, XP Hunter, Wishlist Master, Curator). |

### Authentication Pattern in Server Actions

Every action that modifies user data follows the same pattern:

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';

export async function someProtectedAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // ... protected logic
}
```

---

## 4. TanStack Query Hooks (`src/hooks/`)

The TanStack Query hooks are the bridge between Server Actions and React components on the client. They manage loading states, cache, and automatic refetch.

### `useWishlistGames.ts`

```typescript
export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async () => {
      const stores = await getStores();
      const games = await Promise.all(gameIds.map((id) => getGame(id)));
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

- Fetches stores + games in parallel.
- `enabled: gameIds.length > 0` prevents unnecessary fetch.
- `staleTime: 5min` reduces refetch on fast navigation.

### `usePriceHistory.ts`

Two hooks for price history:

```typescript
// Daily — 90 days
export function useDailyPriceHistory(gameId: string | null, days = 90)

// Weekly — 26 weeks
export function useWeeklyPriceHistory(gameId: string | null, weeks = 26)
```

- Call `getDailyPriceHistoryAction` / `getWeeklyPriceHistoryAction` (Server Actions).
- `enabled: !!gameId` — only executes with valid ID.
- `staleTime: 1h` — historical data changes once per day (via cron).
- `gcTime: 24h` — keeps cache even after component unmount.

---

## 5. Cron Endpoints (`src/app/api/cron/`)

Three scheduled endpoints in Vercel Cron Jobs. All protected by `CRON_SECRET` via `Authorization: Bearer <token>` header.

### `ingest-prices` (every 4h)

```
GET /api/cron/ingest-prices
```

1. Validates `CRON_SECRET`.
2. Calls `ingestPricesAction()` — fetches 100 deals from CheapShark, upserts games, inserts deals + price_history in batches of 50.
3. Returns metrics: `dealsIngested`, `gamesUpserted`, `pricesRecorded`.
4. Status 500 on failure.

### `reindex-typesense` (daily)

```
GET /api/cron/reindex-typesense
```

1. Validates `CRON_SECRET`.
2. Calls `syncGamesToTypesenseAction()` — fetches 100 deals, maps to Typesense schema, batch indexes.
3. Returns `indexed: number`.

### `check-alerts` (every 30min)

```
GET /api/cron/check-alerts
```

1. Validates `CRON_SECRET`.
2. Fetches all active `price_alerts` via Supabase client.
3. For each unique `gameId`, queries CheapShark API `/games?id=` for current price.
4. Updates `currentPrice` in the table.
5. Logs triggered alerts (current price <= targetPrice).
6. Returns `{ processed, triggered, details }`.

### Protection Pattern

All cron endpoints follow the same pattern:

```typescript
const authHeader = request.headers.get('authorization');
if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

The `CRON_SECRET` variable is configured in Vercel Dashboard + GitHub Secrets.

---

## 6. Database Access: Drizzle ORM + raw postgres

The project uses **two database access patterns**, each with its own purpose.

### Drizzle ORM (main pattern)

**Singleton** in `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(dbUrl);
export const db = drizzle({ client: queryClient });
```

Used for:

- Queries with type safety and schema definitions (`src/db/schema/`).
- INSERT/UPDATE with `ON CONFLICT` (`ingestPricesAction`).
- SELECT with JOIN between tables (`getDealsFromDBAction`).
- Calling PostgreSQL functions via `sql` tagged template (`getDailyPriceHistoryAction`).

### Raw `postgres` client (specific operations)

In `alerts.ts` and `playlists.ts`, the `postgres` client is imported directly:

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });
```

Used for:

- Queries with snake_case columns (Supabase default) that the Drizzle schema does not cover.
- `price_alerts`, `playlists`, `playlist_games` — tables that use `userId`, `gameId` (camelCase in SQL columns).
- Operations that require `ON CONFLICT` with full return via `RETURNING *`.
- `connect_timeout: 5` prevents hangs in serverless environments.

**Why two patterns?** The Drizzle schema uses snake_case (`game_id`, `store_id`), but legacy tables in Supabase use camelCase (`userId`, `gameId`). To avoid naming conflicts, actions that access camelCase tables use raw `postgres` directly.

---

## 7. Auxiliary Scraping (`src/services/hltb.ts`)

- **Why:** CheapShark does not provide estimated completion time data. We built a mini scraper for HowLongToBeat.
- **Limitations:** Being a web scraper, it is susceptible to changes in the target site's HTML. The service is encapsulated purely in the Game Details Page, away from the Home, so as not to compromise Initial Performance (FCP).
- Tests in `src/services/hltb.test.ts`.

---

## 8. Rate Limit and Resilience: Fallback Strategies

The CheapShark API enforces strict rate limits. Our layered defense strategy:

1. **Next.js Cache (`revalidate`)** — reduces repeated calls to the external API.
2. **`try/catch` with local fallback** — if CheapShark fails, we return static data (`fallbackDeals`). The user never sees a white screen.
3. **Parameter validation** — in `getDealsAction()`, the `sortBy`, `pageSize`, `upperPrice`, `lowerPrice`, `storeID` and `title` parameters are validated before being sent to the API.
4. **Database timeout** — `connect_timeout: 5` on the `postgres` client to prevent hangs in serverless.
5. **Error logs** — every failure is logged with `console.error` for diagnostics.

---

**Next Step:** Understand how the backend manages user profiles, XP, badges and global state in module [03. Gamification and State Management](03-gamification-and-state.md).
