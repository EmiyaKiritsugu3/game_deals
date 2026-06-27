# Changelog

## [v0.7.0] — 2026-06-25

### Sprint 16 — Polimento & Gap Closure (#55)

- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy added to Supabase middleware.
- **GitHub OAuth**: Button added to AuthModal.
- **i18n**: CookieBanner translated PT→EN (Aceitar/Rejeitar → Accept/Reject).
- **PRD sync**: Profile, gamification, PWA, sitemap, GitHub OAuth, rate limiter marked as Live.
- **PR merges**: #53 (Sentinel timing fix), #54 (Bolt batched fetching).
- **Spec audit**: 6/11 spec items were already resolved (rate limiter, sitemap, SyncManager, complexity, lint-staged, i18n). Real scope was ~3h.
- **Tools**: shadcn CLI + MCP + skill (17 components), motion 12.41, gsap 3.15, UI UX Pro Max, 5 Vercel skills, 10 workflow skills installed.

## [v0.6.0] — 2026-06-24

### Sprint 15 — Gamification, PWA, P2 Wins (#52)

- **Gamification**: Full system — 10 badges across wishlist/playlist/alert categories, XP service layer (`processAction`, `getUserProfile`, `getLeaderboard`, `seedBadges`), action hooks in playlist/alert actions. Profile page expanded with XP bar/level, badge grid, activity timeline, leaderboard opt-in toggle. `/leaderboard` page. `user_stats` migration 0013 + `award_badge()` function.
- **PWA**: `manifest.json`, layout metadata.
- **Quick Wins**: CI `pnpm audit` blocks on HIGH vulns (no more `continue-on-error`). `aria-live` regions on search/notifications/deals.
- **Accessibility**: aria-live regions, LevelBadge component with aria-label.
- **Tests**: 896→980 (+84). 114 test files. Coverage: new code ≥80%.
- **Tech upgrades**: React 19.2.3→19.2.7, TS 5→6.0.3, lucide-react 0.577→1.21, @supabase/ssr 0.9→0.12, biome 2.5.0→2.5.1, vitest 4.1.8→4.1.9, tailwindcss 4.3.0→4.3.1.
- **SonarCloud**: Clean scan. 8/8 CI checks.
- **Cleanup**: 9 open PRs resolved (5 merged, 4 closed). Zero PRs open.

## [v0.5.0] — 2026-06-20

### Sprint 9 — Coverage Push & PRD Evolution (#35, #36)

- **Coverage**: 74.6%→82.42% lines (+7.82pp), 65.4%→79.15% branches (+13.75pp)
- **Tests**: 787→896 (+109). 16 new test files (Charts, DealRow, GameCard, HeroSlide, NotificationBell, DynamicCharts, AddToListModal, GameHero, GameStatsRow, EndingSoon, Freebies, WishlistIndicator, PriceAlertBadge, SearchResults, BundlesPage, CollectionDetailPage)
- **Thresholds**: vitest.config.ts bumped to lines:80, functions:75, branches:76, statements:80
- **PRD Audit**: Fixed 20+ discrepancies (tests 291→896, coverage 30%→82%, 5 items "Not Built" corrected)
- **PRD Evolution**: 10 new production-grade sections (KPIs, SLO/SLA, Observability, Performance Budgets, Analytics, Feature Flags, Tech Debt, Security/Compliance, Incident Response, DX) — 503→824 lines
- **PR #35**: All CI checks green, 896/896 tests pass
- **PR #36**: PRD audit + evolution merged

## [v0.4.0] — 2026-06-19

### Sprint 6 — Coverage Push & Methodology Archival (#32)

- **Coverage**: 50.71%→59.29% lines (+8.58pp), 42.08%→49.5% branches (+7.42pp)
- **Tests**: 506→578 (+72). 13 new test files (fetch-helpers, game-enrichment, social, cron-auth, middleware, client, supabase-browser, useUserAlerts, useAuthSubscription, useClickOutside, useCarousel, useShareWishlist, useWishlistSavedGames)
- **Methodology**: Failed 3-phase SPEC→BUILD→REVIEW experiment archived. Kept CI Nightly + test patterns.
- **Simple workflow**: Adopted — explore → implement → gate → PR
- **PR #32**: All CI checks green, all 13 target files at 100% branch coverage
- **Subagents**: 4 succeeded (deep category), 4 failed (written manually)

## [v0.3.0] — 2026-06-18

### Sprint 3 — Phase C: Polish (#23)

- **PWA**: Service worker (Serwist), offline page, InstallPWAButton
- **Theme**: System-aware dark/light toggle (next-themes)
- **Store Filter**: Searchable combobox, 25-store cap removed
- **Analytics**: Vercel Web Analytics (affiliate clicks, alert triggers)
- **Alerts**: AlertCard extraction (205→139 lines), server-first dual-storage fix
- **Deals**: onConflictDoUpdate upsert (prevents duplicate rows)
- **SonarQube**: 50→0 open issues (S6759 readonly, S7780 String.raw, S1874 Cell, S7924 FP)
- **Middleware**: Fixed String.raw build break (Next.js 16 SWC compat)
- **Tests**: 423 (+196 from Sprint 2), coverage 42.5%
- **Docs**: LICENSE, SECURITY.md, CHANGELOG.md added

## [v0.2.0] — 2026-06-17

### Sprint 2 — Phase B: Quality & UX (#22)

- **TDD Workflow**: RED→GREEN→REFACTOR, tiered gates (pre-commit/pre-push/CI)
- **Coverage**: 26%→42%, thresholds 38/36/33/38
- **SonarQube**: 52→16 (S6759 readonly props, S7780, S4325, S6571)
- **Auth**: idempotent setUser (React #185 fix), useCallback stabilization
- **i18n**: English string validation (35 regex patterns + exhaustive PT scan)
- **Playlists**: Detail cache invalidation, CSPRNG slug generation
- **PWA**: Manifest icons generated (192×192, 512×512)
- **TanStack Query**: Cache invalidation on detail keys
- **Build**: Fixed middleware config parsing, sitemap DB fallback
- **Dependencies**: serwist, next-themes, @vercel/analytics

## [v0.1.0] — 2026-06-16

### Sprint 2 — P0 Notifications + DB Schema (#20)

- **Notifications**: check_alerts_for_all() SQL function (CTE-based, set processing)
- **64-bit Locks**: md5→bigint migration (2^64 collision space)
- **Cron Routes**: Promise.race timeout pattern, CronError structured responses
- **DB Indexes**: Schema optimization (CONCURRENTLY, IF NOT EXISTS)
- **Migrations**: Naming conventions (index vs function files)

## [v0.0.1] — 2026-06-14

### Sprint 1 — P0 Security & Trust (#12, #14, #15)

- **Sentry**: Error monitoring + CSP headers
- **Rate Limiter**: API protection (token bucket)
- **Auth Pages**: Login, callback, error handling
- **OG Image**: Dynamic Open Graph image generation
- **Price Alerts**: End-to-end flow (/alerts page + cron infra)
- **Cron**: ingest-prices, reindex-typesense, check-alerts endpoints
- **Affiliate**: /out redirect route with store allowlist
- **Tests**: 207 tests (from baseline), Fallow CRITICAL: 1→0
- **Knip**: Unused types 9→0, unused exports 4→0

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Given it is pre-1.0:
- **0.x.0**: New sprint or feature batch
- **0.0.x**: Hotfix or patch

Dates use `YYYY-MM-DD` format.
