# Use Cases — GameDeals

User journeys covering the 6 core feature flows. See `docs/runbook.md` for admin/operations flows.

## Use Case Summary

| UC # | Name | Actor | Primary Code Path |
|------|------|-------|-------------------|
| UC-1 | Browse & Filter Deals | Anonymous | `src/app/page.tsx`, `@modal/(.)game/[id]/` |
| UC-2 | Search & View Game Detail | Anonymous | `src/actions/search.ts`, `src/app/game/[id]/` |
| UC-3 | Wishlist & Price Alert | Authenticated | `src/store/wishlistStore.ts`, `src/actions/alerts.ts` |
| UC-4 | Create & Share Playlist | Authenticated | `src/actions/playlists.ts` |
| UC-5 | Affiliate Link → Purchase | Anonymous | `src/app/out/[storeId]/[gameSlug]/route.ts` |
| UC-6 | Browse Collections & Bundles | Anonymous | `src/app/collections/`, `src/app/bundles/` |

---

## UC-1: Browse & Filter Deals

**Actor:** Anonymous User (unauthenticated browsing)

**Preconditions:** None — home page is public with ISR (`revalidate = 3600`)

**Main Flow:**
1. User opens home page → server-rendered deal list from CheapShark API (cached via ISR)
2. User filters by store from dropdown → client-side filter re-renders list
3. User sorts by discount percentage, absolute price, or Metacritic score
4. User clicks a deal card → intercepted modal route opens overlay (`@modal/(.)game/[id]/`)
5. Modal shows: game title, current price, retail price, discount %, store name, Metacritic score
6. User can view full price history chart (`usePriceHistory` hook)
7. User can navigate to full detail page (deep link `/game/[id]`)

**Alternative Flows:**
- **Empty state**: No deals matching filter → "No deals found" message with filter reset option
- **CheapShark API down**: Home shows stale ISR cache (still valid, just not refreshed)
- **Store filter no results**: Empty list with suggestion to clear filters

**Code References:**
- `src/app/page.tsx` — Home page with ISR revalidation
- `src/app/@modal/(.)game/[id]/page.tsx` — Intercepted route modal
- `src/components/GameCard.tsx` — Individual deal card component
- `src/components/GameFilters.tsx` — Filter/sort controls
- `src/app/game/[id]/page.tsx` — Full game detail page

---

## UC-2: Search & View Game Detail

**Actor:** Anonymous User

**Preconditions:** Typesense search index has been populated (or falls back to CheapShark API)

**Main Flow:**
1. User types in Navbar search bar → 300ms debounce before triggering search
2. Search action (`src/actions/search.ts`) queries Typesense first (primary)
3. Typesense returns results → display as dropdown below search bar
4. User clicks a result → navigates to `/game/[id]` detail page
5. Detail page shows: title, description, Metacritic score, Steam rating, release date
6. Price comparison table: list of stores with current prices, deal URLs, savings percentage
7. Price history chart rendered via `usePriceHistory` hook with weekly/daily aggregation
8. User can set price alert or add to wishlist (if authenticated)

**Alternative Flows:**
- **No Typesense API key**: Falls back to CheapShark API search endpoint automatically
- **Typesense cluster down**: Same fallback path — transparent to user
- **No results**: "No games found for '[query]'" with search suggestion tips
- **CheapShark API down**: Both search paths fail → error state with retry button

**Code References:**
- `src/actions/search.ts` — Search action with fallback chain
- `src/app/search/page.tsx` — Full search results page
- `src/app/game/[id]/page.tsx` — Game detail page (server component + client hydration)
- `src/hooks/usePriceHistory.ts` — TanStack Query hook for price chart data
- `src/components/Navbar.tsx` — Search bar with debounce

---

## UC-3: Wishlist & Price Alert

**Actor:** Authenticated User (requires Supabase auth session)

**Preconditions:** User is logged in. Middleware (`src/middleware.ts`) protects `/wishlist` route.

**Main Flow:**
1. User browses deals or searches → clicks heart icon on `GameCard`
2. `wishlistStore.add()` called → optimistic UI update (immediate visual feedback)
3. Game added to Zustand wishlist store → persisted to Supabase via `wishlistStore.syncToSupabase()`
4. User navigates to `/wishlist` → sees all tracked games in a grid
5. User clicks "Set Alert" on a game → modal with target price input
6. User enters target price → `src/actions/alerts.ts` creates `price_alerts` row
7. Cron job (`src/app/api/cron/check-alerts/`) runs every 4 hours:
   a. Queries all active `price_alerts`
   b. Compares `targetPrice` against current deal price from `deals` table
   c. If current price ≤ target price → triggers notification
8. User receives notification (modal banner on next visit or toast)

**Alternative Flows:**
- **Not authenticated**: Redirected to login (or home) by middleware
- **Wishlist full**: Zustand store boundary check (no hard limit, but UI degrades gracefully)
- **Game already in wishlist**: Heart icon shows filled state — clicking removes it
- **Duplicate alert**: Action checks for existing user-game alert — prevents duplicates
- **Cron never runs?**: Alerts simply never fire — no false notifications
- **Supabase sync fails**: Wishlist still works offline (localStorage) — syncs on next successful connect

**Code References:**
- `src/store/wishlistStore.ts` — Zustand store with localStorage persist + Supabase sync
- `src/actions/alerts.ts` — Price alert CRUD server actions
- `src/app/api/cron/check-alerts/route.ts` — Alert evaluation cron job
- `src/app/wishlist/page.tsx` — Wishlist page (protected)
- `src/hooks/useWishlistGames.ts` — TanStack Query hook for wishlist data
- `src/middleware.ts` — Route protection middleware

---

## UC-4: Create & Share Playlist

**Actor:** Authenticated User

**Preconditions:** User is logged in. Playlist route protected by middleware.

**Main Flow:**
1. User navigates to `/playlists` → sees their existing playlists (or empty state)
2. User clicks "New Playlist" → form with name (required) and description (optional)
3. `src/actions/playlists.ts` creates playlist row in DB → returns playlist with auto-generated slug
4. User browses deals/search → clicks "Add to Playlist" → selects target playlist from dropdown
5. Game added to `playlist_games` join table
6. User sets playlist to "Public" → shareable URL generated: `/playlists/shared/[slug]`
7. User copies URL → sends to friend
8. Friend opens URL → sees all games in playlist as a grid (no auth required for public playlists)

**Alternative Flows:**
- **Private playlist**: Share button disabled — no public URL generated
- **Duplicate game in playlist**: Join table has unique constraint — second add silently ignored
- **Playlist with 0 games**: Shareable page shows empty state with "Nothing here yet" message
- **Anonymous user opens shared URL**: Works — public playlist view is unauthenticated

**Code References:**
- `src/actions/playlists.ts` — Playlist CRUD server actions
- `src/app/playlists/page.tsx` — User's playlist management page

---

## UC-5: Affiliate Link → Purchase

**Actor:** Anonymous User (click tracking works for all users)

**Preconditions:** Store is in the affiliate allowlist. Game has a valid external deal URL.

**Main Flow:**
1. User is on game detail page or modal → clicks "View Deal at [Store Name]" button
2. Browser navigates to `/out/[storeId]/[gameSlug]` route
3. Route handler validates:
   a. `storeId` is in affiliate allowlist → 404 if not
   b. `gameSlug` matches regex `^[a-z0-9-]+$` → 404 if not
4. If valid: `affiliate-config.ts` builds full store URL with affiliate tracking params appended
5. Click logged to `affiliate_clicks` table (store, game, timestamp, referrer)
6. User receives HTTP 302 redirect → store checkout page with affiliate tracking active

**Alternative Flows:**
- **Unknown storeId**: Returns 404 — new stores must be added to allowlist first
- **Invalid slug format**: Returns 404 — prevents injection in URL
- **Missing affiliate config for store**: Still redirects but without affiliate params (graceful degradation)
- **Click logging DB error**: Redirect still happens — click is best-effort, not blocking

**Code References:**
- `src/app/out/[storeId]/[gameSlug]/route.ts` — Affiliate redirect route handler
- `src/lib/affiliate-config.ts` — Store allowlist + affiliate URL configuration (17 stores)
- `src/db/schema/affiliates.ts` — Affiliate click logging schema

---

## UC-6: Browse Collections & Bundles

**Actor:** Anonymous User

**Preconditions:** Collections and bundles are editorially curated (static constants, not user-generated)

**Main Flow:**
1. User navigates to `/collections` → sees curated collection cards with title, description, game count
2. User clicks a collection (e.g., "Best Under $10") → grid of games matching that theme
3. Each game in collection is a `GameCard` — click opens modal or detail page
4. User navigates to `/bundles` → sees bundle deals from Humble Bundle, Fanatical, etc.
5. Each bundle shows: title, number of games, total value, price, tier (BTA → Beat The Average)
6. User clicks bundle → individual bundle detail page with game list

**Alternative Flows:**
- **Empty collection**: Collection exists but no games assigned → "Coming soon" subtitle
- **Bundle expired**: Bundles have expiry dates — past-date bundles show "Expired" badge

**Code References:**
- `src/app/collections/[slug]/page.tsx` — Individual collection page
- `src/app/collections/page.tsx` — Collection listing page
- `src/app/bundles/page.tsx` — Bundle listing page

---

## Administrative Use Cases

Administrative and operational flows are documented in `docs/runbook.md`:

| Operation | Playbook | Severity |
|-----------|----------|----------|
| Price ingestion cron failure | [Runbook §1](docs/runbook.md) | CRITICAL |
| Typesense reindex failure | [Runbook §2](docs/runbook.md) | HIGH |
| Alert check cron failure | [Runbook §3](docs/runbook.md) | MEDIUM |
| DB connection pool exhaustion | [Runbook §4](docs/runbook.md) | CRITICAL |
| Supabase auth outage | [Runbook §5](docs/runbook.md) | CRITICAL |
| CheapShark API down | [Runbook §6](docs/runbook.md) | HIGH |
| Typesense search down | [Runbook §7](docs/runbook.md) | HIGH |
| Deployment failure | [Runbook §8](docs/runbook.md) | HIGH |
| Env key rotation (security) | [Runbook §9](docs/runbook.md) | CRITICAL |
| OOM prevention (dev) | [Runbook §10](docs/runbook.md) | LOW |
