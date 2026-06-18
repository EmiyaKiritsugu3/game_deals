# Changelog

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
