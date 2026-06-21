---
title: Sprint 15 Price Alerts E2E Report (SUPERSEDED)
type: session-report
status: superseded
scope: project
tags:
  - pr15
  - price-alerts
  - archived
related:
  - compose/reports/sprint11-accessibility-and-quality
updated: "2026-06-21"
---

# Sprint 15 — Price Alerts E2E / Cron Migration / SonarCloud

> **Branch:** `feat/sprint15-alerts-full`
> **Merged:** 2026-06-16
> **Tests:** 215 (was 207) — +8 component tests
> **Fallow CRITICAL:** 0
> **Maintainability:** 91.2

---

## Summary

Sprint 15 delivered the full price alerts pipeline: `/alerts` page for users, GitHub Actions cron infrastructure (migrating off Vercel's Hobby plan limit), SonarCloud quality gate integration, and component test infrastructure.

---

## Key Changes

### Price Alerts

- **`/alerts` page** — standalone protected page showing user's alerts with cards (game title, target price, current price, remove action)
- **`check_alerts_for_all()` SQL function wired** — previously created in migration 0002/0005 but never called from TS. Now invoked by the cron route via `checkTriggeredAlertsAction()`
- **NotificationBell** — in-app notification component showing triggered alerts count
- **PriceAlertModal** — modal on game detail page to create/delete alerts
- **SyncManager integration** — 1s debounced sync from localStorage to Supabase

### Infrastructure

- **Cron migrated from Vercel → GitHub Actions** — Vercel Hobby plan allows only 1 cron execution/day across all jobs. Moved scheduling to `.github/workflows/cron.yml` with 3 jobs (ingest-prices every 4h, reindex-typesense daily, check-alerts hourly). API endpoints still run on Vercel, called via HTTP with `CRON_SECRET` auth.
- **SonarCloud quality gate** — integrated into `.github/workflows/ci.yml`. Static analysis on every PR and push to main.
- **Migration 0008** — fixed `price_alerts` indexes (dropped redundant, added missing `pa_user_game_unique`)

### SonarQube Fixes Applied

| Issue | Fix |
|-------|-----|
| Middleware `String.raw` template in matcher | Replaced with `RegExp` constructor |
| Component props without `Readonly` | Added `Readonly<>` wrapper |
| CSS contrast: red hover color | Changed `rgba(220,38,38,0.4)` → `hsl(var(--primary)/0.4)` (WCAG AA) |
| Cron secrets in `run` block | Moved to `env` block |
| Negated conditions (SonarCloud cognitive complexity) | Simplified boolean logic |
| `notificationId` mapping | Fixed column mismatch in TypeScript mapping |

### Testing

- **Component test infrastructure** — Vitest + jsdom + React Testing Library
- **8 component tests** for alerts page (renders, empty state, alert cards, remove button)
- **6 E2E tests** for alerts page + cron endpoints (Playwright)
- **Total: 215 tests** (95 baseline + 112 + 8 component)

---

## Technical Debt Added

| Item | Priority | Description |
|------|----------|-------------|
| P10 — Dual-storage alerts | MEDIUM | Zustand localStorage + Supabase DB two sources of truth |
| P11 — deletePriceAlertAction non-atomic | LOW | SELECT then DELETE race |
| P12 — alerts/page.tsx complexity | MEDIUM | 78 lines JSX, 13 cyclomatic complexity |
| P14 — E2E test gap | MEDIUM | No auth flow in E2E tests for alert CRUD |

---

## Stats Update

| Metric | Before Sprint 15 | After Sprint 15 |
|--------|-----------------|-----------------|
| Tests | 207 | 215 |
| Fallow CRITICAL | 0 | 0 |
| Knip unused types | 0 | 0 |
| Unused exports | 0 | 0 |
| Maintainability | 91.2 | 91.2 |
| CI steps | 5 (lint→tsc→test→build→knip) | 6 (+ SonarCloud) |
| Cron platform | Vercel (1x/day limit) | GitHub Actions (unlimited) |
