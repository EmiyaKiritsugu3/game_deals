# 06. Feature Components

Standalone business-logic components that carry independent intelligence. They can live, die, or break on their own without taking down the screen (thanks to Next.js App Router architecture).

## 1. Historical Lows (`src/components/HistoricalLows.tsx`)

- **Server Component:** Purely async execution, no `'use client'`. No TanStack Query — fetches directly from the CheapShark API.
- **Business Logic:**
  CheapShark returns deal listings but doesn't proactively flag which ones hit historical lows. This component:
  1. Calls `Promise.all` to fetch three listings: Deal Rating, Savings, and Recent.
  2. Deduplicates results with `Array.from(new Map(...).values())`.
  3. Scans the list with `Promise.all` calling `getGame(id)` for each candidate.
  4. Filters only deals where `salePrice <= cheapestPriceEver * 1.01` (1% tolerance).
  5. Returns `null` if no lows found — collapses the UI thanks to Flexbox layout.
- **Styling:** Tailwind v4 with `@theme` tokens + encapsulated local styles.

## 2. ActivityFeed (`src/services/social.ts`)

The engagement engine (Gamification).

- **Approach:** Not an isolated React component. Social logic lives in `src/services/social.ts`, consuming the Supabase client directly for playlists, badges, and stats.
- **Gamification Integration:**
  - `createPlaylist()` / `getUserPlaylists()` — CRUD playlists via Supabase.
  - `getUserStats()` / `getUserBadges()` — user stats and achievements.
  - `checkAchievements()` — automatic badge award logic.
- **Server Actions:** Critical gamification operations (XP, badges) are wrappers in `src/actions/gamification.ts`, called from client components or routes.
- **Styling:** Components consuming this service (`AuthModal`, `AddToListModal`) use Tailwind v4 with `@theme` tokens.

## 3. Dynamic Charts (`src/components/DynamicCharts.tsx` + `src/components/Charts.tsx`)

- **`'use client'`:** Required for Recharts chart interactivity.
- **Lazy Loading:** Recharts is dynamically imported via `next/dynamic` with `{ ssr: false }` to avoid bloating the initial bundle:
  ```typescript
  const PriceHistoryChartLazy = dynamic(
    () => import('./Charts').then((mod) => mod.PriceHistoryChart),
    { ssr: false, loading: () => <div>Loading History...</div> }
  );
  ```
- **TanStack Query Hook:** `DynamicPriceHistory` calls `useDailyPriceHistory(gameId)` from `@/hooks/usePriceHistory`, which in turn calls the Server Action `getDailyPriceHistoryAction()` against the database (Drizzle + PostgreSQL). If the game has no gameId, the hook is disabled via `enabled: !!gameId`.
- **Render Logic:** `PriceHistoryChart` renders a `LineChart` from Recharts. Uses real database data when available (`realData.length > 2`), otherwise generates simulated data via `generatePriceHistory()`.
- **`DynamicStoreCompare`:** Renders a `BarChart` comparing prices across stores.
- **Styling:** Tailwind v4 with CSS variables `hsl(var(--...))` for dark theme colors.

## 4. Freebies (`src/components/Freebies.tsx`)

- **Hybrid Client/Server Component:** Receives `deals: Deal[]` as a prop, populated by the Home Page Server Component.
- **Query:** The Home Page calls `getDeals({ upperPrice: "0" })` directly on the CheapShark API (no TanStack Query — single server-side call).
- **Empty State:** If `deals` is empty, returns `null` — the row collapses automatically thanks to Flexbox layout.
- **Render:** Slice of 6 deals, each with thumbnail (via `next/image`), "FREE" badge, and "-100%" voucher.
- **Styling:** Tailwind v4 + design tokens from `tokens.css`.

## 5. Search Results (`src/app/search/page.tsx`)

- **Server Component:** Server-side search page with query param support (`q`, `upperPrice`, `storeID`).
- **Data Fetching:** Calls `getDeals()` with user parameters directly from CheapShark API. For text search, sends `title` in params.
- **Stores Sidebar:** Fetches active stores via `getStores()` + direct CheapShark fetch.
- **Render:** Grid of `GameCard` components. Empty state with friendly message.
- **Styling:** Tailwind v4 with global utility classes + design tokens from `tokens.css`.

## 6. Bundles (`src/app/bundles/page.tsx`)

- **Server Component:** Aggregated bundle listings from stores (Humble Bundle, Fanatical).
- **Data Source:** Static data in `src/data/bundles.ts` — simulated until real API integration.
- **Render:** Grid of bundle cards, each with:
  - Store info (icon + name)
  - Thumbnail grid of included games
  - Price, total value, and savings badge
  - Countdown of remaining days
- **Styling:** Tailwind v4 with color and typography tokens from `tokens.css`.

## 7. Collections (`src/app/collections/[slug]/page.tsx`)

- **Server Component:** Collection detail page with ISR via `generateStaticParams()`.
- **Data Source:** Static metadata in `src/data/collections.ts` with a list of gameIDs.
- **Data Fetching:** Fetches all games in parallel via `Promise.all(collection.gameIDs.map(id => getGame(id)))`. Sorts each game's deals by lowest price.
- **Render:** Grid rows with thumbnail, title, price (or FREE), and "View Deal" CTA.
- **Collections Index (`src/app/collections/page.tsx`):** Card grid with static metadata, linking to detail pages.

---

## TanStack Query Hooks

Client-side hooks that wrap Server Actions with cache and stale-while-revalidate:

### `useDailyPriceHistory(gameId, days)` — `src/hooks/usePriceHistory.ts`

```typescript
export function useDailyPriceHistory(gameId: string | null, days = 90) {
  return useQuery({
    queryKey: ['priceHistory', 'daily', gameId, days],
    queryFn: () => getDailyPriceHistoryAction(gameId ?? '', days),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,  // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  });
}
```

### `useWeeklyPriceHistory(gameId, weeks)` — `src/hooks/usePriceHistory.ts`

```typescript
export function useWeeklyPriceHistory(gameId: string | null, weeks = 26) {
  return useQuery({
    queryKey: ['priceHistory', 'weekly', gameId, weeks],
    queryFn: () => getWeeklyPriceHistoryAction(gameId ?? '', weeks),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

### `useWishlistGames(gameIds)` — `src/hooks/useWishlistGames.ts`

```typescript
export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async () => {
      const stores = await getStores();
      const games = await Promise.all(gameIds.map((id) => getGame(id).catch(() => null)));
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## Styling Architecture

The project uses **Tailwind CSS v4** imported via `@import "tailwindcss"` in `globals.css`. Custom tokens defined in `tokens.css` with `@theme`:

```css
@theme {
  --color-bg-dark: hsl(228 15% 13%);
  --color-primary: hsl(150 100% 42%);
  --color-accent-hl: hsl(150 88% 27%);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

The global design token system is managed by Tailwind v4 via `@theme`, with components consuming the automatically generated CSS variables.

---

## Server Actions

Server Actions in `src/actions/deals.ts` and `src/actions/search.ts` serve as the bridge between client components and external data:

| Action | Function | Used By |
|--------|----------|---------|
| `getDealsAction()` | Fetches deals from CheapShark with validation and fallback | TanStack Query Hooks / Server Components |
| `getGameAction(id)` | Game details | Server Components |
| `getStoresAction()` | StoreID → name mapping | Hooks / Components |
| `getDailyPriceHistoryAction(gameId, days)` | Daily history from DB (Drizzle) | `useDailyPriceHistory` |
| `getWeeklyPriceHistoryAction(gameId, weeks)` | Weekly history from DB | `useWeeklyPriceHistory` |
| `searchGamesAction(query, limit)` | Text search via Typesense (fallback CheapShark) | Search components |
| `ingestPricesAction()` | Cron job: deal ingestion into DB | Route `/api/cron/ingest-prices` |

---

🎉 **Next:** You've read the Feature Components Manual. These components form the intelligence layer of GameDeals — combining Server Components for fresh data, TanStack Query for client-side caching, Server Actions as a safe bridge, and Tailwind v4 for consistent styling.
