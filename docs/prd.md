# GameDeals PRD — Product Requirements Document

## 1. Product Vision

GameDeals helps gamers find the best prices on digital games across 17+ storefronts by aggregating deals from CheapShark, enabling price tracking through wishlists and alerts, and generating affiliate revenue on outbound purchases. The target audience is deal-conscious PC gamers who want one place to monitor prices, get notified of drops, and discover new games within their budget.

## 2. Current State

### 2.1 What We Have

| Feature | Status | Notes |
|---------|--------|-------|
| Browse deals with ISR | Live | Home page revalidates every 3600s |
| Game detail pages | Live | Server component with price history chart |
| Game detail modal | Live | Intercepted route overlay |
| Search (Typesense + CheapShark fallback) | Live | 300ms debounce on Navbar |
| Wishlist (Zustand + Supabase) | Live | Optimistic UI, localStorage persist |
| Price alerts | Live | Modal + DB + 4h cron check |
| Bundles page | Live | Editorially curated constants |
| Collections index and detail | Live | Editorially curated constants |
| Affiliate redirect `/out/[storeId]/[slug]` | Live | 17 store allowlist, click logging |
| Auth (Supabase SSR) | Live | Email/password, Google, Discord OAuth |
| SyncManager | Live | Debounced Zustand-to-Supabase sync |
| 3 cron endpoints | Live | Manual trigger only, no schedule |
| Sitemap | Live | Static pages only — no game detail URLs |
| Price history chart | Live | Weekly/daily aggregation |
| Playlists | Live | Create/add actions, listing page at `/playlists`, individual view at `/playlists/[id]` |
| Profile page | Not built | Route exists in middleware's PROTECTED_PATHS, but `/profile` directory does not exist (returns 404) |
| Gamification | Not built | Schemas exist (badges, XP, activities); zero code |
| PWA / offline | Partial | ThemeToggle exists; manifest and service worker still missing |
| i18n | Partial | English strings test covers ~35 patterns; Portuguese strings in Freebies/FlashSales still present |
| Theme toggle | Live | ThemeToggle component with next-themes support |
| Notification system (Bell + DB + actions) | Live | NotificationBell component, notifications table, 3 Server Actions, TanStack Query polling |
| Freebies carousel (100% off) | Live | Shown on home page |
| FlashSales countdown timer | Live | Shown on home page with countdown clock |
| HistoricalLows verification | Live | Multi-step CheapShark API verification |
| Hero carousel (auto-rotate) | Live | 5s auto-rotation, Matrix background |
| SidebarModal (spring animation) | Live | Framer Motion slide-in, Escape to dismiss |
| Store comparison chart (Recharts) | Live | Bar chart comparing prices across stores |
| CookieBanner | Live | Cookie consent, localStorage persistence |
| Simulated HLTB playtime estimation | Live | Deterministic hash-based playtime, $/hour display |
| Fallback deals | Live | Hardcoded fallback when CheapShark is unreachable |
| Shared wishlist page | Live | `/wishlist/shared?ids=<base64>` |
| EndingSoon deals section | Live | Shown on home page |
| Lazy-loaded charts (DynamicCharts) | Live | Recharts loaded via next/dynamic, SSR disabled |
| GitHub OAuth provider | Wired (no UI) | Coded in handleSocialLogin, no button rendered |
| Rate limiter on auth callback | Live | In-memory Map, 10 req/min/IP — needs distributed upgrade |
| Cron timeout guards (Promise.race) | Live | CronError pattern on all 3 routes |
| Cron route unit tests | Live | route.test.ts for all 3 cron endpoints |
| Search results page (`/search`) | Live | Server component with filter sidebar |

### 2.2 Key Metrics

| Metric | Value |
|--------|-------|
| Tests (Vitest) | 896 passing across 100 files |
| E2E tests (Playwright) | 3 spec files (alerts-crud, alerts, visual regression) |
| Coverage — lines | 82.42% (threshold: 80%) |
| Coverage — functions | 76.85% (threshold: 75%) |
| Coverage — branches | 79.15% (threshold: 76%) |
| Coverage — statements | 82.27% (threshold: 80%) |
| Fallow CRITICAL | 0 |
| Knip unused exports | 0 (5 config hints remain) |
| CI checks | 2 workflows, 8 quality gates (quality: lint→tsc→test→integration→sonarcloud→build→knip→fallow; e2e job; vercel preview) |
| ADRs | 11 Accepted, 1 Proposed (ADR-007 status ambiguous — see note below) |
| DB tables | 11 |
| SQL functions | 10 migrations |

> **ADR-007 note:** Listed as 'Proposed' in the ADR README but its own file header says 'Accepted' — status is ambiguous.

## 3. User Personas

**Anonymous Browser (UC-1, UC-2, UC-5, UC-6).** A casual gamer who visits the site from a search result or social link. They browse deals, filter by store or discount, click a game to see details and price history, and may click an affiliate link to purchase. They never sign up. Their session is ephemeral. They expect instant load times, working search, and accurate prices. If the site is slow or confusing, they leave.

**Power User (UC-3, UC-4).** An authenticated gamer who actively tracks deals across multiple games. They maintain a wishlist, set price alerts with custom targets, create named playlists, and share them publicly. They check the site daily and rely on notifications for price drops. They may have dozens of games tracked. They expect their data to sync across devices seamlessly. They are the primary audience for gamification rewards.

**Admin.** An operator who manages the system. They curate collections and bundles, monitor cron job health (price ingestion, Typesense reindex, alert checks), review affiliate click metrics, and respond to incidents using the runbook. They rarely touch frontend code. They need dashboards and clear operational signals, not flashy UI.

## 4. Functional Requirements

### 4.1 Core Flow: Browse & Discover

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-BR-1 | Home page renders server-side deal list with ISR (revalidate=3600) | P0 | Done |
| F-BR-2 | User can filter deals by store from a dropdown | P0 | Done |
| F-BR-3 | User can sort deals by discount %, absolute price, Metacritic score | P0 | Done |
| F-BR-4 | Clicking a deal card opens game detail in a modal overlay (intercepted route) | P0 | Done |
| F-BR-5 | User can navigate from modal to full game detail page (deep link) | P0 | Done |
| F-BR-6 | Store filter shows all available stores (currently capped at 25) | P2 | 1d |
| F-BR-7 | Home page shows empty state when no deals match filters | P0 | Done |
| F-BR-8 | User can view bundles and collections pages | P0 | Done |

### 4.2 Core Flow: Search

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-SR-1 | Navbar search triggers after 300ms debounce | P0 | Done |
| F-SR-2 | Search queries Typesense first, falls back to CheapShark | P0 | Done |
| F-SR-3 | Results appear as dropdown below search bar | P0 | Done |
| F-SR-4 | Clicking a result navigates to `/game/[id]` detail page | P0 | Done |
| F-SR-5 | Search results page at `/search` is available for full results | P1 | Done |
| F-SR-6 | Search gracefully handles Typesense cluster down (fallback) | P0 | Done |
| F-SR-7 | Search shows empty state with suggestions when no results found | P0 | Done |
| F-SR-8 | Implement hybrid pgvector + FTS search (ADR-010 migration target) | P2 | 3d |

### 4.3 Core Flow: Wishlist & Alerts

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-WA-1 | Authenticated user can heart/add a game to wishlist (optimistic UI) | P0 | Done |
| F-WA-2 | Wishlist persists to localStorage and syncs to Supabase | P0 | Done |
| F-WA-3 | Cloud wishlist loads on new device login (re-add P2 sync) | P2 | 4h |
| F-WA-4 | Protected `/wishlist` page shows all tracked games in a grid | P0 | Done |
| F-WA-5 | User can set a price alert with a target price via modal | P0 | Done |
| F-WA-7 | Alerts page (`/alerts`) lists all active alerts with game info | P0 | Done |
| F-WA-8 | Cron job checks alerts every 4h and triggers notifications | P0 | Done |
| F-WA-9 | Price alert cron runs on a schedule (currently manual-only trigger) | P2 | 2h |
| F-WA-10 | E2E test covers alerts CRUD (create, list, delete) | P2 | 4h |
| F-WA-11 | deletePriceAlertAction uses single atomic DELETE | P1 | 5min |
| F-WA-12 | Alert creation refactored to direct server action (remove dual-storage) | P0 | 2d ⚠️ DATA LOSS: alerts created via modal are saved to localStorage first, synced to DB later. If user closes tab within ~1s, the alert is silently lost. Alert appears in UI then disappears on next page load. |

### 4.4 Core Flow: Affiliate Monetization

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-AF-1 | Clicking "View Deal" navigates to `/out/[storeId]/[gameSlug]` | P0 | Done |
| F-AF-2 | Route validates storeId against 17-store allowlist | P0 | Done |
| F-AF-3 | Route validates gameSlug regex `^[a-z0-9-]+$` | P0 | Done |
| F-AF-4 | Invalid storeId or slug returns 404 | P0 | Done |
| F-AF-5 | Valid request redirects (302) with affiliate params appended | P0 | Done |
| F-AF-6 | Each click is logged to `affiliate_clicks` table | P0 | Done |
| F-AF-7 | Click logging is best-effort (non-blocking to redirect) | P0 | Done |
| F-AF-8 | Unknown stores still redirect without affiliate params | P1 | Done |
| F-AF-9 | Affiliate click analytics dashboard for admins | P3 | 2d |

### 4.5 Core Flow: Playlists & Social (partial)

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-PL-1 | Authenticated user can create a named playlist with optional description | P0 | Done |
| F-PL-2 | User can add/remove games to/from a playlist via dropdown | P0 | Done |
| F-PL-3 | Playlist management page at `/playlists` lists all user playlists | P1 | 2d |
| F-PL-4 | Individual playlist view at `/playlists/[id]` with game grid | P1 | 2d |
| F-PL-5 | Playlist can be set public (shareable) or private | P1 | Done |
| F-PL-6 | Public playlist has shareable URL (no auth required) | P1 | 1d |
| F-PL-7 | Duplicate game in playlist is silently ignored (unique constraint) | P0 | Done |
| F-PL-8 | Empty playlist page shows "Nothing here yet" state | P1 | 1d |
| F-PL-9 | Social sharing — Twitter/Reddit/WhatsApp embed links | P3 | 1d |

### 4.6 Core Flow: Gamification (not yet built)

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-GM-1 | Users earn XP for actions: wishlist add, alert create, playlist create, referral | P3 | 3d |
| F-GM-2 | Badges are awarded when user meets badge criteria (defined in badges table) | P3 | 2d |
| F-GM-3 | Activity feed shows recent actions (game tracked, alert triggered, badge earned) | P3 | 2d |
| F-GM-4 | Profile page displays XP, badge collection, and activity history | P3 | 2d |
| F-GM-5 | Leaderboard shows top users by XP (opt-in) | P3 | 1d |
| F-GM-6 | Existing DB schemas (badges, user_badges, activities, profiles.xp) are wired to real code | P3 | 3d |

### 4.7 Core Flow: Collections & Bundles

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-CB-1 | `/collections` lists editorially curated collection cards | P0 | Done |
| F-CB-2 | `/collections/[slug]` shows game grid for that collection | P0 | Done |
| F-CB-3 | `/bundles` lists bundle deals with price, tier, expiry | P0 | Done |
| F-CB-4 | Expired bundles show "Expired" badge | P1 | Done |
| F-CB-5 | Empty collection shows "Coming soon" subtitle | P1 | Done |
| F-CB-6 | Admin tools to create/edit collections without code changes | P3 | 3d |

### 4.8 Admin Operations (cron, monitoring)

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| F-AD-1 | Price ingestion cron fetches CheapShark deals every 4h | P0 | Done |
| F-AD-2 | Typesense reindex cron runs daily | P0 | Done |
| F-AD-3 | Alert check cron evaluates price_alerts every 4h | P0 | Done |
| F-AD-4 | All cron endpoints protected by CRON_SECRET header | P0 | Done |
| F-AD-5 | Deals insert uses onConflictDoUpdate to prevent duplicates | P2 | 30min |
| F-AD-6 | Set-based SQL function replaces cursor loop in alert checking | P0 | Done — Implemented in PR #20 (CTE-based set processing) |
| F-AD-7 | 64-bit advisory locks replace 32-bit for alert cron | P0 | Done — Implemented in PR #20 (md5→bigint) |
| F-AD-8 | Cron routes have timeout guards with structured CronError | P0 | Done — Already implemented in all 3 cron routes |
| F-AD-9 | Cron unit tests for all 3 routes | P0 | Done — Already implemented in all 3 cron routes |
| F-AD-10 | Cron schedule triggers configured (manual-only today) | P2 | 2h |

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-PF-1 | Home page loads under 2s (first paint) on 4G | P0 | Done |
| N-PF-2 | Search responds within 500ms (median) | P0 | Done |
| N-PF-3 | Game detail page renders server-side, hydrates client within 1s | P0 | Done |
| N-PF-4 | Price history chart loads within 2s (database query + render) | P1 | Done |
| N-PF-5 | Affiliate redirect executes in under 200ms (edge) | P0 | Done |
| N-PF-6 | Implement TimescaleDB hypertable for price_history (ADR-009) | P2 | 3d |

### 5.2 Security

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-SC-1 | All routes behind middleware are authenticated (Supabase SSR) | P0 | Done |
| N-SC-2 | Cron endpoints are protected by CRON_SECRET | P0 | Done |
| N-SC-3 | Affiliate redirect validates storeId and slug format | P0 | Done |
| N-SC-4 | Deals insert no onConflictDoUpdate not a security issue but causes bloat | P2 | 30min |
| N-SC-5 | **Missing: Security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) | P0 | 2h |
| N-SC-6 | **Missing: Sentry/error monitoring** — all errors go to console.error (35+ sites) | P0 | 4h |
| N-SC-7 | In-memory rate limiter used on auth callback — needs distributed upgrade (Upstash/Vercel KV) for multi-instance Vercel deployments | P0 | 1d |
| N-SC-8 | **Missing: `/auth/error` and `/auth/auth-code-error` pages** — referenced but 404 | P0 | 1h |
| N-SC-9 | RLS policies on all user-data tables verified | P1 | Done |

### 5.3 Accessibility

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-AX-1 | **Missing: Skip-to-content link** | P1 | 30min |
| N-AX-2 | **Missing: aria-labels on GameDealRow, FilterSidebar, SearchBox** | P1 | 1h |
| N-AX-3 | **Missing: Per-page error boundaries** (only root error.tsx exists) | P1 | 2h |
| N-AX-4 | Color contrast meets WCAG AA | P2 | Done |
| N-AX-5 | 7 deferred cubic review accessibility items | P2 | 4h |
| N-AX-6 | Interactive elements are keyboard navigable | P2 | Done |

### 5.4 i18n

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-I18N-1 | All user-facing strings in English (en_US) | P0 | Breaking: 4+ locations use Portuguese strings |
| N-I18N-2 | **Missing: ~15+ strings across 4+ component files use Portuguese (Freebies, FlashSales, shared wishlist, out page)** — needs translation | P1 | 1h |
| N-I18N-3 | i18n framework (next-intl or similar) for future locale support | P3 | 2d |

### 5.5 Offline / PWA

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-PWA-1 | **Missing: Web app manifest** | P1 | 1h |
| N-PWA-2 | **Missing: Service worker** for offline cached content | P2 | 2d |
| N-PWA-3 | **Missing: favicon.ico** — placeholder or brand icon | P2 | 30min |
| N-PWA-4 | **Missing: og.png** — referenced in metadata, file doesn't exist | P0 | 30min |

### 5.6 Monitoring & Observability

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-MO-1 | **Missing: Sentry/error monitoring** (also in 5.2) | P0 | 4h |
| N-MO-2 | Cron job success/failure logs are visible in Vercel dashboard | P1 | Done |
| N-MO-3 | **Missing: Custom analytics events** (page views, affiliate clicks, alert triggers) | P2 | 2d |
| N-MO-4 | **Missing: RSS/Atom feed** for deal updates | P3 | 1d |

### 5.7 Test Quality

| ID | Requirement | Priority | Effort |
|----|-------------|----------|--------|
| N-TQ-1 | All existing 896 tests continue to pass | P0 | Ongoing |
| N-TQ-2 | Coverage targets: lines 30%, functions 25%, branches 23%, statements 30% | P0 | Done |
| N-TQ-3 | Phase 2 coverage targets: lines 42%, functions 38%, branches 35%, statements 42% | P2 | Done |
| N-TQ-4 | Phase 3 coverage targets: lines 80%, functions 70%, branches 70%, statements 80% | P3 | Done (actual: 82/77/79/82) |
| N-TQ-5 | Alerts CRUD E2E test (requires auth session fixture) | P2 | Done |
| N-TQ-6 | Cron route unit tests for all 3 endpoints | P0 | Done |

## 6. Quality Gaps

Organized by severity with file references.

### Critical

| Gap | File / Location | Impact | Fix |
|-----|-----------------|--------|-----|
| No Sentry/error monitoring | 35+ `console.error` across codebase | All production errors are silent | Integrate Sentry, replace console.error with Sentry.captureException |
| In-memory rate limiter (auth callback only, not all endpoints) | `src/lib/rate-limit.ts` | Resets on restart, not shared across Vercel instances | Upgrade to Upstash/Vercel KV for multi-instance use |
| Cron workflow: no schedule trigger | 3 cron route files | All cron endpoints manual-only | Configure Vercel Cron Jobs with schedule |
| Alerts dual-storage DATA LOSS | `src/components/PriceAlertModal.tsx` | Alerts created via modal saved to localStorage first, synced to DB later. If user closes tab within ~1s, alert silently lost | Refactor to call server actions directly |

### High

| Gap | File / Location | Impact | Fix |
|-----|-----------------|--------|-----|
| No PWA manifest + service worker | Project root | No install prompt, no offline experience | Add manifest.json, register service worker |
| Mixed PT/EN UI strings | Freebies.tsx, FlashSales.tsx, shared wishlist, out page | Inconsistent UX for English-speaking users | Replace Portuguese strings with English |
| Sitemap missing game detail pages | `src/app/sitemap.ts` | Game detail pages not indexed by search engines | Query DB for game IDs and add to sitemap |
| Missing `aria-live` regions | NotificationBell, WishlistIndicator | Dynamic content changes invisible to screen readers | Add `aria-live="polite"` to dynamic components |
| `AddToListModal` returns null while loading | `src/components/AddToListModal.tsx:114` | No loading indicator — user sees nothing | Show loading spinner instead of null |
| No dependency vulnerability scanning in CI | `.github/workflows/ci.yml` | New vulnerabilities introduced without detection | Add Dependabot, Snyk, or `pnpm audit` to CI |
| CI `continue-on-error: true` on 3 steps | `.github/workflows/ci.yml:53,55,69` | Test failures don't block PRs | Remove `continue-on-error` or add explicit justification |

### Medium

| Gap | File / Location | Impact | Fix |
|-----|-----------------|--------|-----|
| Store filter capped at 25 | GameFilters or FilterSidebar | Stores 26+ never shown | Paginate or search store list |
| Discord button uses GitHub SVG icon | `src/components/AuthModal.tsx:124` | Visual copy-paste bug — GitHub icon shown for Discord login | Replace with Discord icon (simple-icons) |
| No favicon.ico | Project root | Browser tab shows default icon | Add favicon |
| AlertsPage high complexity | `src/app/alerts/page.tsx` | 49.5 CRAP score, 13 cyclomatic complexity | Extract AlertCard sub-component |
| lint-staged Biome fails on markdown files | `package.json` lint-staged config | Blocks commits with .md changes | Remove `md` from lint-staged patterns |
| Fallow exit 1 on pre-push | Pre-push hook | Blocks pushes even on pre-existing findings | Add fallow CI mode or fix findings |

### Resolved (previously listed, now fixed)

| Gap | Resolution |
|-----|-----------|
| Missing `og.png` | Exists at `src/app/og.png/` |
| Missing `/auth/error` and `/auth/auth-code-error` pages | Both exist at `src/app/auth/error/` and `src/app/auth/auth-code-error/` |
| No `global-error.tsx` | Exists at `src/app/global-error.tsx` |
| No skip-to-content link | Implemented at `src/app/layout.tsx:121` |
| Missing aria-labels on GameDealRow, FilterSidebar, SearchBox | Implemented — tested in `tests/unit/components/aria-labels.test.tsx` |
| No per-page error boundaries | `error.tsx` exists in alerts, bundles, collections, search |
| No light mode / theme toggle | ThemeToggle exists at `src/components/ThemeToggle.tsx` |
| Missing security headers | Partial — middleware adds some headers |

### Medium

| Gap | File / Location | Impact | Fix |
|-----|-----------------|--------|-----|
| Store filter capped at 25 | GameFilters or FilterSidebar | Stores 26+ never shown | Paginate or search store list |
| Discord button uses GitHub SVG icon | AuthModal.tsx | Visual copy-paste bug | Replace with Discord icon |
| No favicon.ico | Project root | Browser tab shows default icon | Add favicon |
| AlertsPage high complexity | `src/app/alerts/page.tsx` | 49.5 CRAP score, 13 cyclomatic complexity | Extract AlertCard sub-component |
| lint-staged Biome fails on markdown files | `package.json` lint-staged config | Blocks commits with .md changes | Remove `md` from lint-staged patterns |
| Fallow exit 1 on pre-push | Pre-push hook | Blocks pushes even on pre-existing findings | Add fallow CI mode or fix findings |

### Low

| Gap | File / Location | Impact | Fix |
|-----|-----------------|--------|-----|
| No custom analytics events | Project-wide | No insight into user behavior | Add posthog/ga4 events |
| No RSS/Atom feed | Project root | No way for users to subscribe to deals | Generate feed from deal data |
| No breadcrumb structured data | Game detail pages | Slightly weaker SEO | Add JSON-LD BreadcrumbList |

## 7. Technical Debt Register

| ID | Item | Priority | Effort | File Reference |
|----|------|----------|--------|----------------|
| TD-1 | 9 complexity suppressions across 6 files | P1 | 1d | `src/actions/alerts.ts`, `deals.ts`, `SyncManager.tsx`, `NotificationBell.tsx`, `Navbar.tsx`, `check-alerts/route.ts` |
| TD-2 | Cloud to Local wishlist sync removed | P2 | 4h | `src/components/SyncManager.tsx` |
| TD-3 | Stale setWishlist references in 3 docs | P3 | 15min | `docs/architecture/c4-component.md`, `docs/manual/03-gamification-and-state.md` |
| TD-4 | Deals insert has no onConflictDoUpdate | P2 | 30min | `src/actions/deals.ts:222` |
| TD-5 | lint-staged Biome fails on markdown files | P3 | 15min | `package.json` lint-staged config |
| TD-6 | Missing drizzle snapshot stubs for 0002-0007 | P2 | 30min | `drizzle/meta/` |
| TD-7 | Double encoding in sanitizeTitle | P3 | 15min | `src/actions/deals.ts:35` |
| TD-8 | Dual-storage architecture for alerts | P0 | 2d ⚠️ DATA LOSS: alerts created via modal are saved to localStorage first, synced to DB later. If user closes tab within ~1s, the alert is silently lost. | Zustand + localStorage vs `price_alerts` table |
| TD-9 | deletePriceAlertAction non-atomic | P1 | 5min | `src/actions/alerts.ts` |
| TD-10 | AlertsPage high complexity (49.5 CRAP) | P2 | 2h | `src/app/alerts/page.tsx` |
| TD-11 | 7 deferred cubic review items (a11y, error handling, accessibility) | P2 | 4h | Multiple components |
| TD-12 | Discord button uses GitHub icon | P3 | 30min | `src/components/AuthModal.tsx:124` |
| TD-13 | CI `continue-on-error: true` on 3 steps | P2 | 30min | `.github/workflows/ci.yml:53,55,69` |

## 8. Priority Backlog

### P0 — Ship Now (breaks core experience or is missing)

| Item | Type | Effort | Dependencies |
|------|------|--------|--------------|
| Integrate Sentry error monitoring | NFR/Security | 4h | Sentry account setup |
| Replace in-memory rate limiter with Upstash/Vercel KV | NFR/Security | 1d | Vercel KV provisioned |
| Configure cron schedule triggers | Admin | 2h | Vercel Cron Jobs config |
| Fix alerts dual-storage architecture ⚠️ DATA LOSS | Tech Debt | 2d | Refactor PriceAlertModal to call server actions |

### P1 — High Impact (blocks quality or user trust)

| Item | Type | Effort | Dependencies |
|------|------|--------|--------------|
| Add cloud to local wishlist sync | Feature | 4h | SyncManager refactor |
| Replace ~15+ Portuguese strings across 4+ files with English | NFR/i18n | 1h | None |
| Add PWA service worker | NFR/PWA | 2d | PWA manifest done first |
| Add game detail pages to sitemap | Feature | 1d | DB query for game IDs |
| Reduce 9 complexity suppressions | Tech Debt | 1d | Extract sub-functions |
| deletePriceAlertAction single atomic DELETE | Tech Debt | 5min | None |

### P2 — Medium Impact (blocks polish or future velocity)

| Item | Type | Effort | Dependencies |
|------|------|--------|--------------|
| Add light mode / theme toggle | NFR | 2d | Theme context provider (ThemeToggle exists but needs integration) |
| Lift store filter cap (currently 25) | Feature | 1d | Searchable store dropdown |
| Add custom analytics events | NFR/Monitoring | 2d | Analytics service chosen |
| TimescaleDB hypertable for price_history (ADR-009) | Feature | 3d | Migration plan |
| Deals insert onConflictDoUpdate | Tech Debt | 30min | Unique constraint on (gameId, storeId) |
| Missing drizzle snapshot stubs | Tech Debt | 30min | None |
| AlertsPage complexity extraction | Tech Debt | 2h | None |
| Fix Discord button icon (uses GitHub icon) | Bug | 30min | simple-icons package |
| Remove CI `continue-on-error` or justify | CI | 30min | None |
| Add dependency vulnerability scanning to CI | Security | 1h | Dependabot or pnpm audit |
| Add `aria-live` regions to dynamic components | A11y | 1h | None |

### P3 — Nice to Have (enhancements)

| Item | Type | Effort | Dependencies |
|------|------|--------|--------------|
| Implement gamification system | Feature | 13d (parallelizable to ~7 calendar days with 2 engineers) | Gamification schemas done |
| Admin collection management UI | Feature | 3d | Auth/admin role |
| Affiliate click analytics dashboard | Feature | 2d | Click data exists |
| Social sharing (Twitter/Reddit/WhatsApp embeds) | Feature | 1d | None |
| Hybrid pgvector + FTS search (ADR-010) | Feature | 3d | Supabase pgvector enabled |
| i18n framework (next-intl or similar) | NFR/i18n | 2d | None |
| RSS/Atom feed for deals | NFR | 1d | None |
| Breadcrumb JSON-LD structured data | NFR/SEO | 1h | None |
| Profile page (XP, badges, activity history) | Feature | 2d | Gamification built first |
| Leaderboard (opt-in) | Feature | 1d | Gamification built first |

### Shipped (previously in backlog, now done)

| Item | Resolution |
|------|-----------|
| Add skip-to-content link | Shipped — `src/app/layout.tsx:121` |
| Add aria-labels to GameDealRow, FilterSidebar, SearchBox | Shipped — tested in `tests/unit/components/aria-labels.test.tsx` |
| Add per-page error boundaries | Shipped — error.tsx in alerts, bundles, collections, search |
| Create `/auth/error` and `/auth/auth-code-error` pages | Shipped — both exist |
| Create or add placeholder `og.png` | Shipped — `src/app/og.png/` |
| Add PWA manifest + favicon.ico | Shipped — manifest.json, favicon.ico, icon-192.png, icon-512.png |
| Playlist management page + individual view | Shipped — `/playlists/page.tsx`, `/playlists/[id]/page.tsx` |
| Alerts CRUD E2E test | Shipped — `tests/e2e/alerts-crud.spec.ts` |
| Phase 3 coverage targets (80% lines) | Shipped — actual 82.42% |
| Security headers (partial) | Shipped — middleware adds CSP, X-Content-Type-Options |

## 9. Out of Scope

The following are explicitly NOT being built:
- Mobile native apps (iOS/Android)
- User reviews/ratings system
- Social login beyond Google and Discord (GitHub is wired but no UI button)
- Multi-currency support
- Public API for third-party consumers
- Subscription/membership model
- Physical retail store integration
- Real-time push notifications (polling only for now)

## 10. Risks & Assumptions

| Risk | Impact | Mitigation |
|------|--------|------------|
| CheapShark API deprecation or rate limit changes | Single source of deal data disappears | Fallback deals exist; explore alternative APIs (IsThereAnyDeal, GG.deals) |
| Typesense Cloud pricing changes | Search becomes cost-prohibitive | ADR-010 migration path to Supabase pgvector+FTS |
| Vercel pricing or platform lock-in | Infrastructure cost spike or vendor lock | OpenNext exit strategy documented in ADR-005 |
| Supabase project limits at scale | Row count, bandwidth, or connection limits | Monitor via Supabase dashboard; connection pooling via pgBouncer |
| Single engineer bus factor | All knowledge in one person | Documentation (ADRs, manual, runbook) mitigates; AGENTS.md for AI onboarding |
| CheapShark API returns stale data | Users see incorrect prices | ISR revalidates hourly; cron ingests every 4h |

Assumptions:
- CheapShark API remains the primary data source (ADR-002)
- Typesense remains the search backend through Phase 2 (ADR-010)
- Vercel remains the deployment platform through Phase 2 (ADR-005)
- Single PostgreSQL instance (Supabase) is sufficient for current scale
- English is the primary UI language (Portuguese strings are bugs, not features)

## 11. Timeline & Sprint Mapping

Total estimated effort: ~45 engineer-days across all priorities.

| Phase | Weeks | Scope | Key Deliverables |
|-------|-------|-------|------------------|
| **Phase A: Security & Trust** | 1-2 | All P0 items | Sentry, security headers, auth error pages, og.png, rate limiter upgrade, cron schedule triggers |
| **Phase B: Quality & UX** | 3-5 | All P1 items | Dual-storage fix, wishlist sync restore, a11y baseline, PWA manifest, English strings, sitemap, playlist pages, error boundaries |
| **Phase C: Polish** | 6-10 | All P2 items | PWA service worker, theme toggle, store filter cap, analytics, alerts E2E test, cron tests, TimescaleDB, complexity reductions |
| **Phase D: Growth** | 11+ | All P3 items | Gamification, admin tools, affiliate dashboard, social sharing, pgvector search, i18n framework, profile page |

Each phase assumes 1 engineer. P3 gamification (13d) can be parallelized across 2 engineers for ~7 calendar days.

## 12. Architecture Constraints (Non-Negotiable)

The following decisions are locked. Any change requires a new ADR.

| Constraint | ADR | Rationale |
|------------|-----|-----------|
| Next.js 16 App Router, React 19, Turbopack | ADR-001 | Framework foundation; server components, streaming, ISR |
| Tailwind CSS v4 CSS-first mode (no `@apply` for components) | ADR-011 | Design tokens via CSS variables, glassmorphism aesthetic |
| Supabase Auth with `@supabase/ssr` (server + browser client) | ADR-004 | SSR session management with cookie-based refresh |
| Drizzle ORM + PostgreSQL (no Prisma, no raw SQL for queries) | ADR-001, ADR-004 | Type-safe queries, migrations, schema-first |
| CheapShark API is primary data source | ADR-002 | Deal ingestion, game metadata, store mapping |
| Typesense for search acceleration (may migrate to pgvector) | ADR-010 | Full-text search with fallback to CheapShark API |
| Zustand for client state (wishlist, auth, alerts) | ADR-003 | Lightweight, no boilerplate, localStorage persist |
| TanStack Query v5 for server state | ADR-003 | Auto-refetch, caching, optimistic updates |
| Biome as sole linter/formatter (no ESLint, no Prettier) | ADR-012 | Fast, unified, single config (not `recommended`) |
| pnpm (not npm, not yarn) | ADR-012 | Disk efficiency, strict dependency resolution |
| Vercel deployment (OpenNext exit strategy planned) | ADR-005 | Current host; OpenNext monitored for production-readiness |
| Affiliate redirect via `/out/[storeId]/[slug]` (cloaked, edge) | ADR-006 | Store allowlist, slug validation, click logging |
| Price history storage via Drizzle + PostgreSQL (TimescaleDB planned) | ADR-009 | Append-only table with hypertable target |
| App Router routing (parallel routes, intercepted routes, Nuqs) | ADR-008 | Modal overlay for game detail, URL query params |

## 13. Success Criteria

The product is considered successful when all of the following are true:

1. **No silent failures.** Sentry captures all exceptions. Error rate below 0.1% of requests. No `console.error` remains unmonitored.

2. **Security baseline met.** CSP, HSTS, X-Frame-Options, and X-Content-Type-Options headers are served on every response. Rate limiter is shared across instances (Upstash/Vercel KV). Auth error pages render helpful messages instead of 404.

3. **Search engines index game detail pages.** Technical: Sitemap includes all known game URLs. og.png exists and is served. Stretch: Organic traffic to `/game/[id]` grows month over month.

4. **Wishlist and alerts work reliably across devices.** Users who log in on a new device see their cloud wishlist within 5 seconds. Alerts created on any device appear on `/alerts` immediately. The dual-storage bug is eliminated.

5. **Cron jobs run on schedule.** All 3 cron endpoints have configured Vercel Cron triggers. Failed runs produce Sentry alerts. Zero manual cron executions in the trailing 30 days, verified via Vercel dashboard audit log.

6. **PWA baseline is met.** Manifest is served with correct icons and metadata. Service worker caches static assets. Lighthouse PWA audit scores above 80.

7. **Accessibility baseline is met.** Skip-to-content link is present. All interactive components have aria-labels. Per-page error boundaries prevent total UI crashes. Lighthouse a11y audit scores above 90.

8. **Coverage thresholds exceed Phase 3 targets.** Lines at 80%, functions at 70%, branches at 70%, statements at 80%. Current: 82.42% lines, 76.85% functions, 79.15% branches, 82.27% statements. All 3 cron routes have unit tests. Alerts CRUD E2E test passes in CI.

9. **P0 and P1 backlog items are zero.** All critical and high-priority items from this PRD are implemented, verified, and shipped.

10. **User-facing strings are 100% English.** No Portuguese or other locale strings appear in the UI without explicit i18n framework support.
