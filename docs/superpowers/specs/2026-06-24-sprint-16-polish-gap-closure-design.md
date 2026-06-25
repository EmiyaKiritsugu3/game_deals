# Sprint 16 — Polimento & Gap Closure

**Date:** 2026-06-24
**Version:** v0.7.0
**Status:** Draft → Approved → Merged

## Motivation

Sprint 15 shipped gamification, PWA, profile/leaderboard — 980 tests, v0.6.0. PRD audit reveals 10+ gaps (security headers, i18n, rate limiter, sitemap, complexity debt). This sprint closes all outstanding gaps to reach a clean, production-ready posture before any new features.

## Scope

### Phase A — Housekeeping (~2h)

| Item | File(s) | Detail |
|------|---------|--------|
| **A1.** Merge PR #53 | `src/lib/cron-auth.ts` | Sentinel timing fix — safeEqual hash then compare. CI passes. |
| **A2.** Merge PR #54 | `src/services/api.ts`, `HistoricalLows.tsx` + tests | Bolt batched fetching via `?ids=` endpoint. CI passes. |
| **A3.** lint-staged .md fix | `package.json` lint-staged config | Remove `md` pattern — Biome doesn't process markdown. Blocks commits. |
| **A4.** Drizzle snapshot stubs | `drizzle/meta/` | Snapshots for 0002-0007 missing generate. Stubs to fix `db:push`. |
| **A5.** GitHub OAuth button | `AuthModal.tsx` | Google/Discord buttons exist; GitHub wired but no button. Add it. |

### Phase B — Infra/Security (~4h)

| Item | Detail |
|------|--------|
| **B1.** Security headers audit | Check middleware.ts for: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Add any missing. PRD N-SC-5. |
| **B2.** Rate limiter — DB backend | Replace in-memory Map with Supabase table `rate_limits` (ip, endpoint, window_start, count). Cleanup via TTL or cron. Zero deps. |
| **B3.** Sitemap — game detail URLs | Query DB for game IDs, add to sitemap. Currently only static pages. |

### Phase C — UX Polish (~2h)

| Item | Detail |
|------|--------|
| **C1.** i18n — PT→EN strings | ~15 strings across Freebies, FlashSales, shared wishlist, `/out` page. Translate from Portuguese. |
| **C2.** SyncManager — cloud→local | Re-add `loadFromCloud` on mount. Needed so new-device login populates local wishlist. |

### Phase D — Code Quality (~2h)

| Item | Detail |
|------|--------|
| **D1.** Complexity suppressions (10) | Remaining `// fallow-ignore-next-line` across 5 files. Extract helpers from larger functions. |

### Phase E — Stretch (~2d)

| Item | Detail |
|------|--------|
| **E1.** Custom analytics events | Vercel Web Analytics custom events for affiliate clicks, alert triggers, search. |
| **E2.** RSS/Atom feed | `/api/rss` returning deal entries. Static generation, revalidate hourly. |

## Test Strategy

- Each phase gates on existing test suite (980 tests min).
- Genuine fixes (B1/B2/C1) may add new tests for the specific gap.
- Phase D has no new tests — suppression removal is code motion, preserves existing behavior.
- Phase E adds testable routes.

## Definition of Done

- [ ] All phases A-E complete or documented as deferred
- [ ] No regressions — existing test suite passes
- [ ] No open PRs on repo
- [ ] All 10 fallow complexity suppressions resolved
- [ ] All PRD gaps either closed or tracked in technical-debt.md
