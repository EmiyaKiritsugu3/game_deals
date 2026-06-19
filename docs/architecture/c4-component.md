# C4 Level 3 — Component Diagram

> **Scope**: Next.js Application container — internal components.
> **Primary elements**: Components within the Next.js Web App (App Router, Server Actions, Database Layer, Middleware, External Adapters, Client State, UI Components, TanStack Query Hooks).
> **Intended audience**: Developers working on the GameDeals frontend and backend.

## Diagram

```mermaid
C4Component
title Component diagram — Next.js Application

Person(user, "User", "Browser user visiting GameDeals")

System_Ext(cheapsharkSys, "CheapShark API", "External game deals API")
System_Ext(supabaseSys, "Supabase Auth", "JWT authentication & session management")
System_Ext(postgresSys, "PostgreSQL", "Supabase managed database")
System_Ext(typesenseSys, "Typesense", "Cloud full-text search engine")

Container_Boundary(nextApp, "Next.js Application") {

    Component(middleware, "Middleware", "src/middleware.ts", "Refreshes Supabase auth session cookie on every request. Protects /wishlist, /alerts, /playlists, /profile routes.")

    Component_Boundary(appRouter, "App Router Components (src/app/)") {
        Component(rootLayout, "Root Layout", "layout.tsx", "Metadata, fonts, JSON-LD, ReactQueryProvider, NuqsAdapter, Navbar, SyncManager")
        Component(homePage, "Home Page", "page.tsx (ISR)", "Fetches deals in parallel, renders HeroSection, GameCard grid, DealRow lists, HistoricalLows, EndingSoon")
        Component(gameDetail, "Game Detail", "game/[id]/page.tsx", "Server component with JSON-LD (Product schema), price history chart, affiliate store links")
        Component(interceptedModal, "Intercepted Modal", "@modal/(.)game/[id]/", "Client component overlay for game detail — uses parallel route")
        Component(searchPage, "Search Results", "search/page.tsx", "Typesense InstantSearch with faceted filters (genre, platform, developer)")
        Component(wishlistPages, "Wishlist Pages", "wishlist/ + wishlist/shared/", "Protected wishlist management + public shared wishlist via base64-encoded game IDs")
        Component(redirectRoute, "Affiliate Redirect", "out/[storeId]/[slug]/route.ts", "Validates store ID and game slug, appends affiliate params, logs click, redirects 302")
    }

    Component_Boundary(cronRoutes, "Cron Endpoints (src/app/api/cron/)") {
        Component(ingestPrices, "Ingest Prices", "api/cron/ingest-prices/route.ts", "Every 4h: fetches 100 deals from CheapShark, upserts games + deals + price_history")
        Component(reindexTypesense, "Reindex Typesense", "api/cron/reindex-typesense/route.ts", "Daily: fetches CheapShark deals, batch-indexes into Typesense collection")
        Component(checkAlerts, "Check Alerts", "api/cron/check-alerts/route.ts", "Every 15min: queries price_alerts, compares current prices, returns triggered alerts")
    }

    Component_Boundary(serverActions, "Server Actions (src/actions/)") {
        Component(dealsAction, "Deals", "deals.ts", "getDealsAction, getGameAction, getStoresAction, ingestPricesAction, getDealsFromDBAction, getDailyPriceHistoryAction")
        Component(searchAction, "Search", "search.ts", "searchGamesAction (Typesense with CheapShark fallback), syncGamesToTypesenseAction, createTypesenseCollectionAction")
        Component(alertsAction, "Alerts", "alerts.ts", "createPriceAlertAction, getUserAlertsAction, deletePriceAlertAction, checkTriggeredAlertsAction")
        Component(playlistAction, "Playlists", "playlists.ts", "createPlaylistAction, getUserPlaylistsAction, addGameToPlaylistAction, removeGameFromPlaylistAction, deletePlaylistAction, getPublicPlaylistAction")
        Component(gamificationAction, "Gamification", "gamification.ts", "addXPAction, getUserXPAction, getBadgesAction, getUserBadgesAction, awardBadgeAction, checkAndAwardBadgesAction")
    }

    Component_Boundary(externalAdapters, "External Adapters (src/services/ + src/lib/)") {
        Component(cheapsharkSvc, "CheapShark Service", "src/services/api.ts", "getDeals, getGame, getStores — raw fetch wrappers with next.revalidate caching. Also provides getStoreLogo, getDrmType, isGreyMarketStore helpers.")
        Component(typesenseClient, "Typesense Client", "src/lib/typesense.ts", "Admin client (server-side), search-only adapter (client-safe), InstantSearch adapter, GAME_SCHEMA definition, batch index function")
        Component(affiliateCfg, "Affiliate Config", "src/lib/affiliate-config.ts", "17 store affiliate mappings with base URLs and param templates. Used by redirect route and game detail pages.")
    }

    Component_Boundary(dbLayer, "Database Layer (src/db/)") {
        Component(drizzleClient, "Drizzle ORM Client", "src/db/index.ts", "Singleton postgres pool + drizzle() wrapper. All DB code imports this single db export.")
        Component(dbSchema, "Schema Definitions", "src/db/schema/", "8 files: users.ts, games.ts, deals.ts, price_history.ts, affiliates.ts, playlists.ts, gamification.ts. Barrel export via index.ts. Snake_case columns.")
    }

    Component_Boundary(clientState, "Client State (src/store/)") {
        Component(authStore, "Auth Store", "authStore.ts", "Zustand store with lazy Supabase browser client. Hydrates from SSR user, subscribes to onAuthStateChange.")
        Component(wishlistStore, "Wishlist Store", "wishlistStore.ts", "Zustand persist middleware (localStorage key: gameDeals_wishlist). addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist.")
        Component(alertStore, "Alert Store", "alertStore.ts", "Zustand persist middleware (localStorage key: gamedeals-alerts-storage). addAlert, removeAlert, hasAlert, getAlert.")
    }

    Component_Boundary(tanstackHooks, "TanStack Query Hooks (src/hooks/)") {
        Component(useWishlistGames, "useWishlistGames", "useWishlistGames.ts", "useQuery wrapper that fetches game details and stores for wishlist IDs. 5min staleTime.")
        Component(usePriceHistory, "usePriceHistory", "usePriceHistory.ts", "useQuery wrapper around getDailyPriceHistoryAction / getWeeklyPriceHistoryAction. Used on game detail pages.")
    }

    Component_Boundary(uiComponents, "UI React Components (src/components/)") {
        Component(navbarCmp, "Navbar", "Navbar.tsx", "Debounced search (300ms), auth state indicator, wishlist badge count, mobile menu.")
        Component(gameCardCmp, "GameCard", "GameCard.tsx", "Price display, store badge, heart button (wishlist toggle), price alert trigger.")
        Component(syncManagerCmp, "SyncManager", "SyncManager.tsx", "Lazy-init Supabase client. Syncs localStorage wishlist/alerts with Supabase tables on auth state change.")
        Component(otherCmps, "Other Components", "~40 more", "HeroSection, DealRow, FlashSales, Freebies, Charts, AuthModal, CookieBanner, DealBadge, HeartButton, AddToListButton, PriceAlertModal, FilterSidebar, SidebarModal, ActivityFeed, BadgeIcon, etc.")
    }
}

' === DATA FLOWS ===

' Person → App
Rel(user, rootLayout, "HTTP requests", "Next.js SSR")
Rel(user, homePage, "Browses deal categories", "ISR — revalidate 3600s")
Rel(user, gameDetail, "Views game detail + chart", "SSR + JSON-LD")
Rel(user, searchPage, "Searches with filters", "Dynamic SSR")

' Middleware → Supabase Auth
Rel(rootLayout, middleware, "Request passes through", "Next.js middleware pipeline")
Rel(middleware, supabaseSys, "Refreshes session cookie", "updateSession()")

' Server Actions → Drizzle → PostgreSQL
Rel(dealsAction, drizzleClient, "Writes ingested deals", "Drizzle ORM insert/update")
Rel(dealsAction, cheapsharkSvc, "Fetches deal data", "imported function call")
Rel(cheapsharkSvc, cheapsharkSys, "HTTP GET", "cheapshark.com/api/1.0")
Rel(searchAction, typesenseClient, "Searches via", "searchGames()")
Rel(typesenseClient, typesenseSys, "Full-text query", "REST API")
Rel(alertsAction, drizzleClient, "CRUD alerts", "Drizzle ORM + raw SQL")
Rel(playlistAction, drizzleClient, "CRUD playlists", "Drizzle ORM + raw SQL")
Rel(gamificationAction, drizzleClient, "XP/badge ops", "Drizzle ORM")
Rel(drizzleClient, postgresSys, "SQL queries", "TCP via postgres.js")

' App Router → Server Actions
Rel(homePage, cheapsharkSvc, "Fetches deals (server)", "getDeals()")
Rel(searchPage, searchAction, "Calls", "searchGamesAction()")
Rel(gameDetail, cheapsharkSvc, "Fetches game", "getGame()")
Rel(gameDetail, dealsAction, "Fetches price history", "getDailyPriceHistoryAction()")
Rel(gameDetail, affiliateCfg, "Builds store URLs", "affiliate param mapping")
Rel(redirectRoute, affiliateCfg, "Validates + redirects", "Store URL builder")

' Cron → Server Actions
Rel(ingestPrices, dealsAction, "Triggers scheduled", "CRON_SECRET auth")
Rel(reindexTypesense, searchAction, "Triggers scheduled", "CRON_SECRET auth")
Rel(checkAlerts, alertsAction, "Triggers scheduled", "CRON_SECRET auth")

' Client → TanStack Query → Server Actions
Rel(gameCardCmp, useWishlistGames, "Subscribes to", "useQuery")
Rel(gameDetail, usePriceHistory, "Subscribes to", "useQuery")
Rel(useWishlistGames, cheapsharkSvc, "Fetches details", "getGame() + getStores()")
Rel(usePriceHistory, dealsAction, "Calls via", "getDailyPriceHistoryAction()")

' Client Components → Zustand Stores
Rel(navbarCmp, authStore, "Reads user state", "Zustand useAuth()")
Rel(navbarCmp, wishlistStore, "Reads count", "Zustand useWishlist()")
Rel(gameCardCmp, wishlistStore, "Toggles wishlist", "Zustand toggleWishlist()")
Rel(gameCardCmp, alertStore, "Toggles alert", "Zustand addAlert/removeAlert()")

' SyncManager → Supabase
Rel(syncManagerCmp, supabaseSys, "Syncs local ↔ remote", "Supabase browser client")
Rel(syncManagerCmp, authStore, "Updates auth state", "onAuthStateChange callback")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## Component Responsibilities

### App Router Components (`src/app/`)

The Next.js 16 App Router drives all rendering. Server Components (default) handle data fetching on the server, minimizing client bundle size. The root layout (`layout.tsx`) wraps every page with providers: `ReactQueryProvider` for TanStack Query, `NuqsAdapter` for URL query state, and global components (`Navbar`, `SyncManager`, `CookieBanner`). The home page (`page.tsx`) uses ISR with `revalidate=3600` and fetches 5 deal categories in parallel. Game detail pages (`game/[id]/`) render server-side with JSON-LD structured data. The intercepted modal route (`@modal/(.)game/[id]/`) provides a client-side overlay for game details without full navigation. The affiliate redirect (`out/[storeId]/[slug]/route.ts`) validates store IDs against the allowlist and appends affiliate URL parameters.

### Cron Endpoints (`src/app/api/cron/`)

Three cron-triggered routes execute scheduled data pipeline tasks. All are protected by a shared `CRON_SECRET` header check. `ingest-prices` runs every 4 hours: fetches the top 100 deals from CheapShark, upserts games into the `games` table, batch-inserts deals into `deals` and `price_history`. `reindex-typesense` runs daily: pulls deal data from CheapShark and batch-indexes into Typesense. `check-alerts` runs every 15 minutes: queries `price_alerts`, compares current lowest prices against target prices, and returns triggered alerts for notification dispatch.

### Server Actions (`src/actions/`)

Server Actions (`'use server'`) form the backend gateway between UI components and data sources. Five files provide:

| Action File | Key Functions | Data Sources |
|---|---|---|
| `deals.ts` | `getDealsAction`, `getGameAction`, `ingestPricesAction`, `getDealsFromDBAction` | CheapShark Service, Drizzle ORM |
| `search.ts` | `searchGamesAction`, `syncGamesToTypesenseAction`, `createTypesenseCollectionAction` | Typesense Client (fallback: CheapShark) |
| `alerts.ts` | `createPriceAlertAction`, `getUserAlertsAction`, `checkTriggeredAlertsAction` | raw SQL (postgres.js) |
| `playlists.ts` | `createPlaylistAction`, `addGameToPlaylistAction`, `getPublicPlaylistAction` | raw SQL (postgres.js) |
| `gamification.ts` | `addXPAction`, `getBadgesAction`, `checkAndAwardBadgesAction` | Drizzle ORM |

Server Actions authenticate via `supabase.auth.getUser()` and enforce ownership checks before mutations. Actions in `deals.ts` and `search.ts` call external adapters; those in `alerts.ts` and `playlists.ts` use raw `postgres.js` SQL for complex queries with JOINs.

### Database Layer (`src/db/`)

Drizzle ORM provides type-safe SQL. The singleton `db` export (`src/db/index.ts`) is a `postgres` pool wrapped by `drizzle()`. Schema (`src/db/schema/`) defines 8 tables: `games`, `deals`, `users`, `price_history`, `affiliates`, `playlists`, `gamification`. All columns use **snake_case** matching PostgreSQL convention. The `deals` table stores current active deals (refreshed every 4 hours by cron), while `price_history` accumulates a time series of price snapshots for historical charts.

### External Service Adapters (`src/services/` + `src/lib/`)

- **CheapShark Service** (`src/services/api.ts`): Thin fetch wrappers for CheapShark API endpoints. Uses `next: { revalidate: 3600 }` for ISR caching. Also provides helper functions: `getStoreLogo()`, `isGreyMarketStore()`, `getDrmType()`, `getRegionTag()`. **Data owner**: this service owns the CheapShark API contract — all CheapShark calls go through this file.

- **Typesense Client** (`src/lib/typesense.ts`): Dual-client setup. Admin client (requires `TYPESENSE_ADMIN_KEY`) for server-side indexing. Search-only client (uses `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`) for browser-safe InstantSearch. Defines `GAME_SCHEMA` with fields for faceted filtering (genre, platform, developer). Provides `searchGames()` and `indexGamesBatch()` functions.

- **Affiliate Config** (`src/lib/affiliate-config.ts`): Maps 17 store IDs to affiliate base URLs and query param templates. Used by the redirect route and game detail pages to build click-through URLs.

### Client State (`src/store/`)

Three Zustand stores manage client-side state:

| Store | Persistence | Purpose |
|---|---|---|
| `authStore` | None (SSR sync) | Lazy-init Supabase browser client. Stores user profile, provides `setUser()` and `logout()`. |
| `wishlistStore` | `localStorage` (`gameDeals_wishlist`) | Array of game IDs. `toggleWishlist()` adds/removes. `setWishlist(ids[])` replaces the entire list (e.g., after cloud→local merge in SyncManager). |
| `alertStore` | `localStorage` (`gamedeals-alerts-storage`) | Array of `PriceAlert` objects with target price, current price, keyshop preference. |

The `SyncManager` component handles two-way sync between localStorage and remote Supabase tables, triggered by auth state changes.

### TanStack Query Hooks (`src/hooks/`)

Two hooks wrap server data fetching with TanStack Query:

- `useWishlistGames`: Fetches game details and store names for the user's wishlist. Runs as `useQuery` with 5-minute `staleTime`. Enabled only when `gameIds.length > 0`.
- `usePriceHistory`: Wraps `getDailyPriceHistoryAction()` and `getWeeklyPriceHistoryAction()` for game detail charts. Handles loading and error states automatically.

### UI React Components (`src/components/`)

~45 React components organized by function. Key components:

- `Navbar`: Debounced search input (300ms), auth state indicator, wishlist badge, mobile menu
- `GameCard`: Price display with store badge, heart button (wishlist), price alert trigger
- `SyncManager`: Lazy-init Supabase client, localStorage ↔ remote sync engine
- `HeroSection`, `DealRow`, `FlashSales`, `Freebies`, `EndingSoon`, `HistoricalLows`: Home page section components
- `Charts`, `DynamicCharts`: Recharts-based price history visualization
- `AuthModal`, `CookieBanner`, `FilterSidebar`, `SidebarModal`: Overlay/dialog components

### Middleware (`src/middleware.ts`)

Single middleware file that calls `updateSession()` from `@/utils/supabase/middleware`. Refreshes the Supabase auth session cookie on every matched request. Protects authenticated routes (`/wishlist`, `/alerts`, `/playlists`, `/profile`) by redirecting unauthenticated users to the home page. Matches all routes except static assets and public files.

## Key Data Flows

```
App Router (src/app/)
  │
  ├─→ Server Actions (src/actions/) ──→ External Adapters (src/services/, src/lib/)
  │     │                                    │
  │     └─→ Drizzle ORM (src/db/) ──→ PostgreSQL
  │
  ├─→ Middleware (src/middleware.ts) ──→ Supabase Auth
  │
  ├─→ Cron Routes (src/app/api/cron/) ──→ Server Actions (src/actions/)
  │
  └─→ Client Components (src/components/)
        │
        ├─→ Zustand Stores (src/store/)
        │
        └─→ TanStack Query Hooks (src/hooks/) ──→ Server Actions (src/actions/)
                                                    └─→ External Adapters
```

### Data Ownership

| Data | Owner | Storage |
|---|---|---|
| Game deals, prices, stores | CheapShark Service (`src/services/api.ts`) | CheapShark API (external) |
| Cached deals + price history | Drizzle ORM (`src/db/`) | PostgreSQL |
| Full-text search index | Typesense Client (`src/lib/typesense.ts`) | Typesense cloud |
| User sessions | Supabase Auth middleware (`src/middleware.ts`) | Supabase Auth (JWT) |
| Wishlist, alerts (persistent) | Zustand stores + Drizzle ORM | localStorage + PostgreSQL |
| Auth state | Auth Store (`src/store/authStore.ts`) | Zustand (memory) |
| Game metadata, playlists, XP/badges | Drizzle ORM (`src/db/`) | PostgreSQL |

## Related Documents

- [C4 Level 1 — System Context](c4-system-context.md)
- [C4 Level 2 — Container](c4-container.md)
- [Data Flow](data-flow.md)
