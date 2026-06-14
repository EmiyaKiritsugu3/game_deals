# 03. Gamification and State Management

GameDeals uses three distinct state layers: **Zustand** for global client state, **TanStack Query** for server data and client cache, and **Server Actions** + **Drizzle ORM** for mutations and persistence. Each layer has a well-defined responsibility.

---

## 1. Zustand — Global Client State

Zustand (~1 KB, zero boilerplate, no providers) replaces Context API and Redux. Three independent stores, each in a separate file under `src/store/`.

### authStore.ts (`src/store/authStore.ts`)

Manages user session. **Lazy-init** of the Supabase browser client to avoid SSR crash — the client is only loaded via dynamic `import()` inside `getSupabase()`.

```typescript
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (supabaseUser: SupabaseUser | null) => void;
  logout: () => Promise<void>;
}
```

- `setUser()` maps `SupabaseUser` → local `User` (id, name, email, avatar with DiceBear fallback).
- `logout()` calls `supabase.auth.signOut()` and clears state.
- No `persist` middleware — session is reloaded from SSR on mount via `useEffect` in Navbar + `onAuthStateChange`.

### wishlistStore.ts (`src/store/wishlistStore.ts`)

Array of IDs (`string[]`) persisted in **localStorage** via Zustand's `persist` middleware (key: `gameDeals_wishlist`).

```typescript
interface WishlistState {
  wishlist: string[];
  addToWishlist: (gameID: string) => void;
  removeFromWishlist: (gameID: string) => void;
  toggleWishlist: (gameID: string) => void;
  isInWishlist: (gameID: string) => boolean;
  setWishlist: (ids: string[]) => void;
}
```

- Operations are **local** (no fetch). Sync with Supabase happens later via `setWishlist()`.
- `addToWishlist` prevents duplicates with `includes()` before adding.
- `removeFromWishlist` filters by ID.
- `toggleWishlist` combines add/remove in a single method for use in toggle buttons.

### alertStore.ts (`src/store/alertStore.ts`)

Price alerts with `persist` middleware (key: `gamedeals-alerts-storage`).

```typescript
interface PriceAlert {
  gameID: string;
  gameTitle: string;
  targetPrice: number;
  currentPrice: number;
  isKeyshopAllowed: boolean;
  createdAt: number;
}

interface AlertState {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'createdAt'>) => void;
  removeAlert: (gameID: string) => void;
  hasAlert: (gameID: string) => boolean;
  getAlert: (gameID: string) => PriceAlert | undefined;
}
```

- `addAlert` updates if existing or inserts new (with `createdAt: Date.now()`).
- Persisted alerts are checked by cron `/api/cron/check-alerts`.

### Why Zustand?

| Alternative | Problem |
|-------------|---------|
| Context API | Cascading re-renders without strict `useMemo` |
| Redux | Excessive boilerplate for simple needs |
| Jotai/Recoil | More complex API, smaller ecosystem |

Zustand: isolated stores, native `persist` middleware, TypeScript-first, ~1KB.

---

## 2. TanStack Query — Server Data on the Client

**Server state** (deals, prices, history) does not go to Zustand. It uses **TanStack Query v5** with hooks in `src/hooks/`.

### useWishlistGames (`src/hooks/useWishlistGames.ts`)

Fetches wishlist game details via CheapShark API.

```typescript
export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async () => {
      const stores = await getStores();
      const games = await Promise.all(
        gameIds.map((id) => getGame(id).catch(() => null))
      );
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

- `enabled: gameIds.length > 0` — does not fire query with empty list.
- `catch(() => null)` — offline game does not break the entire list.
- `staleTime: 5 min` — prevents refetch on fast navigation.

### usePriceHistory (`src/hooks/usePriceHistory.ts`)

Two hooks — `useDailyPriceHistory` and `useWeeklyPriceHistory` — that call **Server Actions** (`getDailyPriceHistoryAction`, `getWeeklyPriceHistoryAction`).

```typescript
export function useDailyPriceHistory(gameId: string | null, days = 90) {
  return useQuery({
    queryKey: ['priceHistory', 'daily', gameId, days],
    queryFn: () => getDailyPriceHistoryAction(gameId ?? '', days),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,     // 1 hour
    gcTime: 24 * 60 * 60 * 1000,   // GC after 24h
  });
}
```

### Responsibility Division

| Scenario | Technology | Location |
|----------|------------|----------|
| Global client state | Zustand | `src/store/` |
| Server data cache | TanStack Query | `src/hooks/` |
| Mutations and persistence | Server Actions | `src/actions/` |
| Type-safe schema | Drizzle ORM | `src/db/schema/` |

---

## 3. Gamification — Drizzle + Server Actions

The gamification system uses **Drizzle ORM** for schema and **Server Actions** (`'use server'`) for business logic. Replaces the old `src/services/social.ts` service that called Supabase client directly.

### Drizzle Schema (`src/db/schema/gamification.ts`)

Four tables:

```typescript
// Badges available in the system
export const badges = pgTable('badges', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  iconSvg: text().notNull(),
  rarity: varchar({ length: 20 }).default('Common'),
  criteria: jsonb().notNull(), // { type: "wishlist_count", threshold: 10 }
});

// Badges earned by user (unique index prevents duplicates)
export const userBadges = pgTable('user_badges', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  badgeId: uuid().notNull(),
  awardedAt: timestamp().defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_badges_user_badge_unique').on(table.userId, table.badgeId),
]);

// User activity history
export const activities = pgTable('activities', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  actionType: varchar({ length: 50 }).notNull(),
  details: jsonb(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Persisted wishlist (relational, per user)
export const wishlists = pgTable('wishlists', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  gameId: uuid().notNull(),
  addedAt: timestamp().defaultNow().notNull(),
}, (table) => [
  uniqueIndex('wishlists_user_game_unique').on(table.userId, table.gameId),
]);
```

Principles:
- `snake_case` in PostgreSQL columns (project convention).
- `uuid().defaultRandom()` for PKs.
- `uniqueIndex` for uniqueness constraints (badge per user, game per wishlist).
- `jsonb()` for `criteria` and `details` — flexible, no rigid schema.
- `ON CONFLICT DO NOTHING` in raw SQL insertions.

### Server Actions (`src/actions/gamification.ts`)

Operations using `db.execute(sql\`...\`)` with Drizzle + PostgreSQL raw queries.

| Action | Description |
|--------|-----------|
| `addXPAction(userId, amount, reason)` | Adds XP to profile + logs activity |
| `getUserXPAction(userId)` | Returns user's total XP |
| `getBadgesAction()` | Lists all available badges |
| `getUserBadgesAction(userId)` | User's badges with JOIN and `awardedAt` |
| `awardBadgeAction(userId, badgeId)` | Awards badge, ignores duplicate (ON CONFLICT DO NOTHING) |
| `checkAndAwardBadgesAction(userId)` | Checks metrics and awards automatic badges |

**`addXPAction` Flow:**
1. `INSERT INTO profiles ... ON CONFLICT (id) DO UPDATE SET xp = xp + amount` — atomic upsert.
2. `INSERT INTO activities` — action log.
3. No explicit transaction (each statement is atomic in PostgreSQL).

**`checkAndAwardBadgesAction` Flow:**
1. Fetches XP, wishlist count, playlist count.
2. For each badge (First Steps, XP Hunter, Wishlist Master, Curator), checks threshold.
3. Calls `awardBadgeAction` which uses `ON CONFLICT (userId, badgeId) DO NOTHING` — already existing badge is silently ignored.
4. Returns `true` regardless of how many badges were awarded.

### Playlist System (`src/actions/playlists.ts` + `src/db/schema/playlists.ts`)

Playlists use **two relational tables** (not an array of strings):

```typescript
export const playlists = pgTable('playlists', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  isPublic: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const playlistGames = pgTable('playlist_games', {
  id: uuid().defaultRandom().primaryKey(),
  playlistId: uuid().notNull().references(() => playlists.id),
  gameId: uuid().notNull(),
  notes: varchar({ length: 500 }),
  addedAt: timestamp().defaultNow().notNull(),
});
```

Playlist Server Actions (`src/actions/playlists.ts`):
- `createPlaylistAction(title, description, isPublic)` — generates slug, inserts, returns playlist.
- `getUserPlaylistsAction()` — lists user playlists with `LEFT JOIN COUNT(gameCount)`.
- `addGameToPlaylistAction(playlistId, gameId, notes)` — checks ownership before inserting.
- `removeGameFromPlaylistAction(playlistId, gameId)` — checks ownership before deleting.
- `deletePlaylistAction(playlistId)` — checks ownership.
- `getPublicPlaylistAction(slug)` — fetches public playlist + JOIN with `games` for complete data.

All playlist actions use `postgres` raw client (not Drizzle ORM) with `ON CONFLICT DO NOTHING` to avoid duplicates.

### Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                  │
├─────────────────────────────────────────────────────────┤
│  Server Components (page.tsx, layouts)                    │
│    │ fetch() + revalidate tags + use cache (ISR)         │
│    ▼                                                     │
│  src/actions/*.ts (Server Actions)                        │
│    ├── gamification.ts  → db.execute(sql`...`)           │
│    └── playlists.ts     → postgres raw queries           │
│    │                                                      │
│    ▼ Drizzle ORM / Raw SQL                               │
│  PostgreSQL (Supabase)                                    │
│    ├── badges, user_badges, activities, wishlists        │
│    ├── playlists, playlist_games                         │
│    └── profiles (xp column)                              │
├─────────────────────────────────────────────────────────┤
│  Client Components (Navbar, Wishlist, Charts)            │
│    │                                                      │
│    ▼ TanStack Query v5 hooks                             │
│    ├── useWishlistGames → api.ts (CheapShark)            │
│    └── usePriceHistory → server actions (Drizzle)        │
│    │                                                      │
│    ▼ Zustand stores (src/store/)                         │
│    ├── authStore.ts     → session + lazy Supabase init    │
│    ├── wishlistStore.ts → localStorage persist           │
│    └── alertStore.ts    → price alerts persist           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Typical Gamification Flow

1. User adds game to wishlist → `wishlistStore.addToWishlist(id)` (instant, local).
2. TanStack Query `useWishlistGames` detects new ID and fetches details.
3. When user logs in, local wishlist is synced with Supabase via `wishlists` table.
4. Server Action `addXPAction` is called, incrementing XP in profile.
5. `checkAndAwardBadgesAction` scans metrics and awards badges automatically.
6. Badges are visible via `getUserBadgesAction` (JOIN badges + user_badges).

---

**Next Step:** See how the UI gears support all this in [04. Routing and Pages (App Router)](04-pages-routing.md).
