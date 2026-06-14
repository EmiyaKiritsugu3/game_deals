# 🛤️ 04. Routing and Pages (App Router)

GameDeals uses the Next.js 16 App Router with a folder structure under `src/app/`. Below is the dissection of each route, its data patterns, and architectural decisions.

```
src/app/
├── layout.tsx              # Root layout — providers, fonts, JSON-LD
├── page.tsx                # Home — ISR revalidate=3600
├── loading.tsx             # Global loading state (Suspense)
├── not-found.tsx           # Custom 404 page
├── globals.css             # Global styles (Tailwind v4)
├── sitemap.ts              # Dynamic sitemap
├── robots.ts               # robots.txt configuration
│
├── @modal/                 # Parallel Route — route interception
│   └── (.)game/[id]/
│       └── page.tsx        # Game detail modal (sidebar overlay)
│
├── game/
│   └── [id]/
│       └── page.tsx        # Game detail page (full page)
│
├── search/
│   └── page.tsx            # Search with filters (CheapShark)
│
├── wishlist/
│   ├── page.tsx            # Protected dashboard (wishlist + alerts)
│   └── shared/
│       └── page.tsx        # Shared wishlist (public, base64)
│
├── bundles/
│   └── page.tsx            # Bundle listing (static data)
│
├── collections/
│   ├── page.tsx            # Curated collections index
│   └── [slug]/
│       └── page.tsx        # Collection detail (generateStaticParams)
│
├── out/
│   └── [storeId]/[gameSlug]/
│       └── route.ts        # Affiliate redirect cloak
│
├── auth/
│   └── callback/
│       └── route.ts        # Supabase OAuth callback
│
└── api/
    └── cron/
        ├── ingest-prices/     # Cron: CheapShark ingestion (4h)
        ├── reindex-typesense/ # Cron: Typesense reindex (daily)
        └── check-alerts/      # Cron: alert verification
```

---

## 1. Root Layout (`src/app/layout.tsx`)

The root layout is a **Server Component** that orchestrates the entire application. Its props include `{ children, modal }` — the second is a **Parallel Route Slot** that Next.js automatically fills with the content of `@modal/`.

Responsibilities:

- **Fonts:** Inter via `next/font/google` in CSS variable `--font-inter`.
- **Global SEO:** Open Graph metadata, Twitter Cards, JSON-LD (WebSite + SearchAction) injected via `<script type="application/ld+json">`.
- **Providers:** `NuqsAdapter` (query string state), `ReactQueryProvider` (TanStack Query).
- **Fixed Components:** `Navbar` (global navigation), `SyncManager` (syncs Zustand auth + Supabase), `CookieBanner`.
- **Analytics:** `@vercel/analytics/react` + `@vercel/speed-insights/next` at the end of `<body>`.
- **Modal Slot:** `{modal}` rendered below `{children}`, allowing intercepted routes to overlay content.

```tsx
// layout.tsx — return snippet
<NuqsAdapter>
  <ReactQueryProvider>
    <Navbar serverUser={null} />
    <SyncManager />
    {children}
    {modal}
    <Analytics />
    <SpeedInsights />
    <CookieBanner />
  </ReactQueryProvider>
</NuqsAdapter>
```

> [!IMPORTANT]
> The `modal` slot is required in the layout. Without it, the `@modal/(.)game/[id]` route interception does not work.

---

## 2. Loading Global (`src/app/loading.tsx`)

Automatically rendered by React Suspense during route transitions. Displays a spinner with the message "Scanning for discounts...". Prevents the feeling of stalling while Server Components load remote data.

---

## 3. Home Page (`src/app/page.tsx`)

**Server Component** with **ISR** configured via `export const revalidate = 3600` (revalidates every 1 hour).

### Data Strategy

Uses `Promise.all` to fetch 5 categories in parallel, eliminating waterfall:

```tsx
const [popular, bestDeals, recentDeals, flashDeals, freebies] = await Promise.all([
  getDeals({ pageSize: '5' }),            // Deal Rating (default)
  getDeals({ sortBy: 'Savings', pageSize: '10' }), // Biggest %
  getDeals({ sortBy: 'Recent', pageSize: '10' }),  // Most recent
  getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }), // Flash
  getDeals({ upperPrice: '0', pageSize: '6' }), // 100% OFF Freebies
]);
```

### Sections

| Section | Source | Rendering |
|---------|--------|-----------|
| Hero Carousel | `popular.slice(0, 5)` | Server — passes `deals` as prop |
| Freebies | `freebies` | Server — `Freebies` component |
| Flash Sales | `flashDeals` | Server — `FlashSales` |
| Popular Grid | `popular.slice(5)` | Server — `GameCard` in grid |
| New Deals | `recentDeals` | Server — `DealRow` in list |
| Best Deals | `bestDeals` | Server — `DealRow` in list |
| Historical Lows | Own Hook (`getDeals` internal) | Modular — no props |
| Ending Soon | Own Hook (`getDeals` internal) | Modular — no props |

The last two (`<HistoricalLows />` and `<EndingSoon />`) are self-sufficient modules that fire their own `getDeals()` requests. This reduces `page.tsx` size and allows each to have its own loading logic.

---

## 4. Game Detail (`/game/[id]`)

### Full Page (`src/app/game/[id]/page.tsx`)

**Server Component** with dynamic metadata via `generateMetadata` — fetches the game from CheapShark API and generates OG title with best price.

Flow:
1. Extracts `id` from `params` (now `Promise<{ id: string }>` in Next.js 16).
2. Fetches `getGame(id)` + `getStores()` in parallel via `Promise.all`.
3. Renders hero image, statistics (best price, historical low, cost-per-hour), offer grid (Official Stores + Keyshops), price history chart, and store comparison chart.
4. Injects Product JSON-LD with the offers.

Error handling: if `game.info` is null, displays "Game not found" with return link.

### Intercepted Modal (`src/app/@modal/(.)game/[id]/page.tsx`)

**Parallel + Intercepting Route.** Next.js intercepts internal navigations to `/game/[id]` and renders the content inside `<SidebarModal>` — a side overlay that does not replace the current page.

- Pattern: `(.)game/[id]` — the `(.)` indicates same-level segment interception.
- Hard refresh (F5) breaks the interception and falls through to the primary route `/game/[id]` (SEO-friendly behavior).
- Uses `Suspense` with fallback "Loading game..." while `GameModalContent` fetches async data.
- The modal content is nearly identical to the full page, but without `generateMetadata` (modals don't have their own metadata).

---

## 5. Search (`/search?q=&upperPrice=&storeID=`)

**Server Component** in `src/app/search/page.tsx`. Static metadata: `title: 'Search Results | Game Deals'`.

Flow:
1. Reads `searchParams` (now `Promise<{ [key: string]: string | string[] | undefined }>` in Next.js 16).
2. Dynamically builds CheapShark API parameters (`title`, `upperPrice`, `storeID`).
3. Fetches active stores to feed `<FilterSidebar />`.
4. Renders result grid with `GameCard`.

If deals is empty, displays "No deals found" with suggestion to adjust filters.

> Note: currently the search uses CheapShark directly. Typesense is configured for future fallback via `src/actions/search.ts`.

---

## 6. Wishlist (`/wishlist`)

**Client Component** (`'use client'`) in `src/app/wishlist/page.tsx`. Route protected by middleware — unauthenticated user is redirected to `/` with `?auth=required`.

### Features

- **Dashboard** with two tabs: Wishlist (heart) and Alerts (bell).
- **Sorting:** by discount, price or name.
- **Sharing:** encodes IDs in base64 and generates link `/wishlist/shared?ids=...`.
- **Game Card:** thumb, price, % discount, store badge, "See Details" link.
- **Inline Actions:** `HeartButton` (remove) and `PriceAlertTrigger` (configure alert).
- **Statistics Panel:** total wallet value and biggest discount.
- **Empty State:** `HeartCrack` illustration + call to action "Discover Epic Deals".

Data: uses `useWishlistGames(wishlist)` hook (TanStack Query) that receives an array of game IDs and returns enriched data from CheapShark.

### Shared Wishlist (`/wishlist/shared`)

**Client Component** that reads `ids` from `searchParams`, decodes base64, validates with regex (`/^[a-zA-Z0-9]+$/`), and fetches data via `useWishlistGames`.

- Public — anyone with the link can view.
- No authentication required.
- "Buy as Gift" button points to `/game/[id]`.

---

## 7. Bundles (`/bundles`)

**Server Component** with static data from `@/data/bundles`. Metadata: `title: 'Game Bundles | GameDeals'`.

Renders bundle card grid with:
- Store icon and name, tier (if any).
- Bundle name and thumbs of included games.
- Price, number of games, total value, % savings.
- External CTA with countdown of remaining days.

Bundles are defined in a TypeScript file (`src/data/bundles.ts`) — manual update.

---

## 8. Collections (`/collections`)

### Index (`src/app/collections/page.tsx`)

**Server Component** static. Lists all collections defined in `@/data/collections` with emoji, title, description, and game count. Each card links to `/collections/[slug]`.

### Detail (`src/app/collections/[slug]/page.tsx`)

**Server Component** dynamic with `generateStaticParams` (generates pages for all slugs in `COLLECTIONS`).

Flow:
1. Matches `slug` against `COLLECTIONS`. If not found, calls `notFound()`.
2. Fetches all collection games in parallel via `Promise.all(collection.gameIDs.map(id => getGame(id)))`.
3. Orders deals by lowest price and displays grid with thumb, title, price and "View Deal →" link.

---

## 9. Affiliate Redirect (`/out/[storeId]/[gameSlug]`)

**Route Handler** (API Route via App Router) in `src/app/out/[storeId]/[gameSlug]/route.ts`.

Operation:
1. Extracts `storeId` and `gameSlug` from `params`.
2. Validates `storeId` against allowlist of 17 stores (`affiliateConfig`) via regex `/^\d{1,3}$/`.
3. Validates `gameSlug` via regex `/^[a-zA-Z0-9_-]{1,100}$/`.
4. Fetches deal URL from database (`deals` table via Drizzle raw SQL).
5. Applies affiliate parameters from config (e.g., `?partner=gamedealsBR`, `?aff_id=gamedeals_fnt`).
6. Validates hostname against `ALLOWED_DOMAINS` (prevents arbitrary redirect).
7. Logs click in `affiliate_clicks` table (fire-and-forget, does not block redirect).
8. Redirects with `302`.

If any validation fails, redirects to `/` (safe fallback).

---

## 10. Auth Callback (`/auth/callback`)

**Route Handler** that completes the Supabase OAuth flow.

Flow:
1. Rate limiting by IP (10 requests per minute via `@/lib/rate-limit`).
2. Extracts `code` and `next` from query string.
3. Validates that `next` is a local path (prevents open redirect).
4. Exchanges `code` for session via `supabase.auth.exchangeCodeForSession(code)`.
5. Redirects to `next` (or `/` if not specified).
6. On error, redirects to `/auth/auth-code-error`.

---

## 11. Endpoints Cron (`/api/cron/*`)

Protected by `CRON_SECRET` — check `Authorization: Bearer ${CRON_SECRET}` header. Return `401` if missing or invalid.

| Route | Frequency | Action |
|-------|-----------|--------|
| `ingest-prices` | Every 4h | Fetches deals from CheapShark, inserts into `deals` + `price_history` via `ingestPricesAction()` |
| `reindex-typesense` | Daily | Reindexes all games from database in Typesense via `syncGamesToTypesenseAction()` |
| `check-alerts` | Periodic | Queries `price_alerts`, fetches current prices, updates `currentPrice`, logs triggered alerts |

---

## 12. Middleware (`src/middleware.ts`)

Uses `@supabase/ssr` for session refresh on every request.

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Route Protection

The middleware checks `supabase.auth.getUser()` on each request:

- **Protected routes** (`/wishlist`, `/alerts`, `/playlists`, `/profile`): redirects to `/` with `?auth=required` if user is not authenticated.
- **Auth routes** (`/auth/*`): redirects to `/profile` if user is already logged in.
- **Other routes:** passes through unchanged.

### Cookies

Uses `getAll()`/`setAll()` from `@supabase/ssr` to sync cookies between request and response, ensuring the session token is updated on every navigation.

---

## 13. Sitemap & Robots

### Sitemap (`src/app/sitemap.ts`)

Generates dynamic sitemap with:
- Static pages: `/` (priority 1.0, daily), `/search` (0.8, weekly), `/bundles` (0.7, weekly), `/collections` (0.7, monthly).
- Dynamic collections: `top-deals`, `under-10`, `free-games`, `new-releases` (0.8, daily).

### Robots (`src/app/robots.ts`)

Allows crawling of all routes except:
- `/api/` — API endpoints
- `/auth/` — authentication flow
- `/out/` — affiliate redirects

---

## Patterns Summary

| Pattern | Where | Why |
|---------|-------|-----|
| Parallel `Promise.all` | Home, Game Detail, Collections | Eliminates network waterfall |
| Server Component by default | All pages | Less JS on client, native SSR |
| `'use client'` only when needed | Wishlist (interactivity) | Local state, animations, hooks |
| ISR (`revalidate`) | Home Page (3600s) | Semi-static content with periodic update |
| Intercepting Route `(.)` | `@modal/(.)game/[id]` | Modal UX without losing URL for SEO |
| Parallel Route `@modal` | Root layout | Dedicated slot for overlays |
| Route Handler | `/out/*`, `/auth/callback`, `/api/cron/*` | Server-side logic without React |
| Middleware auth | Every request | Session refresh + route protection |
| `generateMetadata` | Game detail, Collections | Dynamic SEO per page |
| `generateStaticParams` | Collections `[slug]` | Pre-rendering known pages |

---

**Next Step:** Dissection of visual components in module [05. Core UI Components](05-core-components.md).
