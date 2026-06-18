# Sprint 3 — Phase C: Polish

## TL;DR

> **Quick Summary**: Ship 7 of 8 P2 polish items from PRD §11 (Phase C) plus 4 critical technical-debt items (P4, P7, P10, P12). Track 7 (TimescaleDB) **deferred** — requires Supabase Pro. 7 independent feature branches run in parallel, each following strict TDD (RED → GREEN → REFACTOR). Coverage ramps from ~25% → 38% lines / 36% functions / 33% branches (Phase 2 stretch targets).
>
> **Deliverables**:
> - PWA service worker (offline caching, install prompt, Lighthouse PWA ≥80)
> - Theme toggle (light/dark, system preference, `next-themes`)
> - Store filter cap removal (searchable combobox, all stores)
> - Custom analytics events (PostHog: page views, affiliate clicks, alert triggers)
> - Alerts CRUD E2E test (auth → create → list → delete)
> - Cron route unit test expansion (coverage gaps → ≥80% on all 3 routes)
> - TimescaleDB hypertable for `price_history` (ADR-009 implementation) 🔴 **DEFERRED to Sprint 4** — blocked by Supabase Pro
> - Complexity reductions (10 fallow suppressors → ≤3)
> - Tech debt: P4 (deals onConflictDoUpdate), P7 (drizzle snapshot stubs), P10 (alerts dual-storage fix), P12 (AlertsPage complexity)
>
> **Estimated Effort**: Large (~16-18 dev days, parallelizable to ~5-7 calendar days across 3-4 tracks)
> **Parallel Execution**: YES — 3 parallel waves, max 6 tasks in Wave 2
> **Critical Path**: P7 (snapshot stubs) → Track 6 (cron tests) → Final Verification  
> **Deferred**: Track 7 (TimescaleDB) — blocked by Supabase Pro requirement
> **Test Coverage Delta**: +13% lines, +17% functions, +15% branches

---

## Context

### Original Request
> "Create a detailed Sprint 3 plan for the GameDeals project based on the PRD Phase C: Polish" — all 8 P2 items from PRD §11, plus technical-debt fold-in. TDD methodology, parallel tracks, atomic commits, ultrawork-ready.

### Interview Summary
**Decisions made** (defaults applied, see `§ Defaults Applied`):
- **Analytics**: PostHog Cloud (free tier) over Vercel Analytics — better fit for funnel/affiliate tracking
- **PWA**: Serwist (next 16-native, Workbox-based) over Workbox direct or hand-rolled
- **Theme**: `next-themes` library (Next.js standard) over custom provider
- **TimescaleDB**: Hand-written SQL migration following 0008-0011 pattern

**Research Findings**:
- Cron route tests already exist (P1: 0% remaining per technical-debt.md) → Task 6 is **expansion + coverage gap-filling**, not "write from scratch"
- `FilterSidebar.tsx:93` has hardcoded 25-store limit (`Number.parseInt(s.storeID, 10) <= 25`)
- `PriceAlertModal.tsx:48-52` writes to Zustand BEFORE server (data loss window)
- 10 fallow complexity suppressors in 5 files: `actions/alerts.ts`, `actions/deals.ts`, `SyncManager.tsx`, `actions/search.ts`, `api/cron/check-alerts/route.ts`
- `drizzle/meta/` only has snapshots for 0000 and 0001 (P7)
- `price_history` schema is NOT a hypertable (P2: ADR-009 implementation deferred)
- `alerts/page.tsx` = 201 lines, 5 inline sub-components, CC=13, CRAP=49.5 (P12)

### Metis Review
**Identified Gaps (addressed)**:
- ✅ TimescaleDB requires Supabase Pro plan → flagged as blocker for Track 7 (verify before Wave 2)
- ✅ PostHog needs API key in env → fold into Track 4
- ✅ Test coverage delta must hit Phase 2 targets → explicit per-track coverage requirements
- ✅ `next-themes` requires `suppressHydrationWarning` on `<html>` → noted in Track 2
- ✅ Serwist + Next.js 16 App Router requires `instrumentation.ts` registration → noted in Track 1
- ✅ Drizzle snapshot stubs (0002-0011) needed BEFORE TimescaleDB migration → Wave 1 dependency
- ✅ AlertsPage complexity refactor should NOT merge before P10 dual-storage fix (P10 changes the data flow first)
- ✅ TimescaleDB chunk interval = 1 day, retention = 2 years (per ADR-009)

---

## Work Objectives

### Core Objective
Complete Phase C: Polish — all 8 P2 items from PRD §11, plus 4 priority technical-debt items. Ship with full TDD coverage, no regressions, and a verifiable Lighthouse PWA score.

### Concrete Deliverables
- [ ] `feat/sprint3-pwa-sw` — PWA service worker + install prompt
- [ ] `feat/sprint3-theme` — Light/dark theme toggle
- [ ] `feat/sprint3-store-filter` — Searchable store dropdown (all stores)
- [ ] `feat/sprint3-analytics` — PostHog event tracking
- [ ] `feat/sprint3-alerts-e2e` — Alerts CRUD Playwright test
- [ ] `feat/sprint3-cron-tests` — Cron route test coverage expansion
- [ ] `feat/sprint3-timescale` — TimescaleDB hypertable migration
- [ ] `feat/sprint3-complexity` — ✅ REMOVED (already done)
- [ ] `feat/sprint3-deals-upsert` — P4: deals onConflictDoUpdate
- [ ] `feat/sprint3-snapshot-stubs` — P7: drizzle snapshot stubs
- [ ] `feat/sprint3-alerts-dedup` — P10: alerts dual-storage fix
- [ ] `feat/sprint3-alerts-page` — P12: AlertsPage complexity extraction
- [ ] All 8 branches merged to main, 8 PRs reviewed and approved
- [ ] Coverage gates pass: lines ≥38%, functions ≥36%, branches ≥33%, statements ≥38%
- [ ] Lighthouse PWA audit ≥80

### Definition of Done
- [ ] All 12 atomic commits merged via PRs
- [ ] `pnpm check` passes (lint → tsc → test:coverage → build → knip)
- [ ] CI green on all PRs
- [ ] No new fallow CRITICAL findings
- [ ] Lighthouse PWA score ≥80
- [ ] No console.error remains unmonitored in new code (Sentry capture)
- [ ] No manual cron executions in trailing 7 days (where applicable)

### Must Have
- 8 feature branches with strict RED → GREEN → REFACTOR commit pattern
- Every new code path has test coverage (TDD mandate)
- Atomic commits (1 concern = 1 commit)
- No new TypeScript `any` (use `unknown` + type guard if needed)
- No new console.log/console.error in prod (use Sentry instead)
- All schema changes via Drizzle migrations (no raw `db.execute` for DDL)
- Use `./node_modules/.bin/biome` and `./node_modules/.bin/tsc` (not `rtk lint`/`rtk tsc`)

### Must NOT Have (Guardrails)
- ❌ Vercel Analytics (decision: PostHog only — avoid dual-tracking)
- ❌ next-pwa library (deprecated, use Serwist)
- ❌ Custom theme provider (use `next-themes`)
- ❌ Refactor outside technical-debt register (scope creep)
- ❌ Gamification (P3, defer to Phase D)
- ❌ Mobile app / native shell (out of scope)
- ❌ i18n framework (P3, defer)
- ❌ Update `getDealsAction` or `getGameAction` (similar fallow suppressors, defer)
- ❌ Change existing cron route signatures (only expand test coverage)
- ❌ Modify `.env.example` without verifying code reads the new var (P22 lesson: env naming mismatch broke CI)
- ❌ Use `git push --no-verify` unless explicitly for pre-existing fallow
- ❌ Dev server (`pnpm dev`) in parallel subagents (OOM risk per AGENTS.md)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — all verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Vitest 365 tests + Playwright 12 tests)
- **Automated tests**: **STRICT TDD** (RED → GREEN → REFACTOR for every task)
- **Framework**: Vitest (unit + component) + Playwright (E2E)
- **Coverage ramp targets** (this sprint):

| Metric | Sprint 2 (now) | Sprint 3 target | Delta |
|--------|----------------|-----------------|-------|
| Lines | ~25% | **38%** | +13% |
| Functions | ~19% | **36%** | +17% |
| Branches | ~18% | **33%** | +15% |
| Statements | ~24% | **38%** | +14% |

**Threshold buffer**: +2% margin built into `vitest.config.ts` thresholds.

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/sprint3-{track}/task-{N}-{slug}.{ext}`.

- **PWA/Service Worker**: Lighthouse CLI + Playwright (manifest validates, SW registers, offline mode works)
- **Theme**: jsdom + Playwright (HTML class, system pref, localStorage persistence)
- **Store filter**: jsdom + Playwright (no cap, search filters, multi-select)
- **Analytics**: jsdom mock + Playwright network (events fire on correct triggers)
- **Alerts E2E**: Playwright with Supabase auth fixture
- **Cron tests**: Vitest (mock-heavy, fast)
- **TimescaleDB**: psql against dev DB + Drizzle introspection
- **Complexity**: Fallow audit + line count delta

### Per-Task Verification Commands
```bash
# TDD cycle (every task)
pnpm test --changed --reporter=verbose   # <10s, RED → GREEN
pnpm test:coverage                       # Full suite, coverage delta
pnpm lint                                # Biome
./node_modules/.bin/tsc --noEmit         # Type check (not rtk tsc)
./node_modules/.bin/biome check .        # Real Biome (not rtk lint)

# Pre-push full CI
pnpm check                               # lint → tsc → test → build → knip

# Track-specific
npx lhci autorun --collect.staticDistDir=.next  # Lighthouse PWA
psql $DATABASE_URL -c "SELECT * FROM _timescaledb_catalog.hypertable WHERE table_name = 'price_history';"  # Timescale verify
pnpm fallow:audit                        # Complexity delta
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 6 independent foundation tasks):
├── T1: P7 — Drizzle snapshot stubs for 0002-0011 (chore)
├── T2: Coverage threshold ramp to 42% lines / 38% functions (chore)
├── T3: P4 — deals onConflictDoUpdate (TDD)
├── T4: P12 — AlertsPage complexity extraction (TDD)
├── T5: P10 prep — extract alertStore.test.ts test scaffold (TDD)
└── T6: PostHog + Serwist + next-themes dependencies installed (chore)

Wave 2 (After Wave 1 — 8 parallel feature tracks, max 6 parallel):
├── Track 1 (2d): PWA Service Worker (Serwist + install prompt)
├── Track 2 (2d): Theme Toggle (next-themes)
├── Track 3 (1d): Store Filter Cap Removal (searchable combobox)
├── Track 4 (2d): Custom Analytics Events (PostHog)
├── Track 5 (4h): Alerts CRUD E2E Test
├── Track 6 (2d): Cron Route Unit Test Expansion
├── Track 7 (3d): TimescaleDB Hypertable (depends T1, blocks T-verify)
└── Track 8: ✅ REMOVED (done in PRs #13/#14)

Wave 3 (After Wave 2 — integration + cross-track):
├── T-INT1: Merge all 8 feature branches sequentially
├── T-INT2: Coverage delta verification (must hit 42% lines)
├── T-INT3: Lighthouse PWA audit (must be ≥80)
├── T-INT4: Sentry verify (no new console.error in prod)
└── T-INT5: Final smoke test (all features working together)

Final Verification (After ALL — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 (snapshots) → Track 6 (cron tests) → T-INT1 → F1-F4  
Deferred: Track 7 (TimescaleDB) — blocked by Supabase Pro
Parallel Speedup: ~70% faster than sequential (8 tracks parallel)
Max Concurrent: 6 (Wave 2 tracks)
```

### Dependency Matrix (all 12 deliverable branches + 6 Wave 1)

| Branch / Task | Depends On | Blocks | Effort |
|---------------|------------|--------|--------|
| **T1** snapshot stubs | None | T7 (TimescaleDB) | 1h |
| **T2** coverage threshold | None | All tracks (CI gate) | 30min |
| **T3** P4 deals upsert | None | Track 6 (cron tests) | 1h |
| **T4** P12 AlertsPage | None | Track 5 (E2E), T5 | 2h |
| **T5** alertStore test scaffold | None | P10 implementation | 1h |
| **T6** deps install | None | Tracks 1, 2, 4 | 30min |
| **Track 1** PWA SW | T6 | T-INT3 | 2d |
| **Track 2** Theme | T6 | T-INT1 | 2d |
| **Track 3** Store filter | None | T-INT1 | 1d |
| **Track 4** Analytics | T6 | T-INT1 | 2d |
| **Track 5** Alerts E2E | T4 | T-INT1 | 4h |
| **Track 6** Cron tests | T3 | T-INT1 | 2d |
| **Track 7** TimescaleDB | T1, T2 | T-INT1, T-INT2 | 3d | 🔴 DEFERRED |
| **Track 8** Complexity | None | T-INT2 | 2d |
| **P10** alerts dual-storage | T4, T5 | T-INT1 | 2d |
| **T-INT1** merge all | All 12 branches | T-INT2-5 | 4h |
| **T-INT2** coverage verify | T-INT1 | Final | 1h |
| **T-INT3** Lighthouse | Track 1 | Final | 1h |
| **T-INT4** Sentry verify | T-INT1 | Final | 30min |
| **T-INT5** smoke test | T-INT1 | Final | 1h |
| **F1-F4** parallel reviews | T-INT1-5 | Done | 2h |

### Agent Dispatch Summary

- **Wave 1 (foundation)**: 6 `quick` tasks (1h each, mostly chores)
- **Wave 2 (parallel features)**:
  - Track 1 PWA: `visual-engineering` (SW + manifest UI) + `quick` (Serwist config)
  - Track 2 Theme: `visual-engineering` (toggle UI) + `quick` (provider wiring)
  - Track 3 Store filter: `visual-engineering` (combobox) + `quick` (cap removal)
  - Track 4 Analytics: `unspecified-high` (PostHog init) + `quick` (event hooks)
  - Track 5 E2E: `quick` (Playwright spec)
  - Track 6 Cron tests: `quick` (Vitest unit tests, 8-10 tests)
  - Track 7 Timescale: `unspecified-high` (migration + Drizzle sync + tests)
  - Track 8: ✅ REMOVED (already done)
- **Wave 3 (integration)**: 1 `unspecified-high` (merge orchestration) + 4 `quick` (verifications)
- **Final (reviews)**: 4 parallel — `oracle` (compliance), `unspecified-high` (quality), `unspecified-high` + playwright (QA), `deep` (scope)

---

## TODOs

> Implementation + Test = ONE Task. Every task has: Recommended Agent Profile + Parallelization + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE.**

### Wave 1 — Foundation (Start Immediately, 6 Parallel Tasks)

- [ ] 1. **T1: Generate Drizzle snapshot stubs for 0002-0011 (P7)**

  **What to do**:
  - Run `pnpm db:generate --custom` against a copy of schema to produce missing snapshots
  - OR manually clone `0001_snapshot.json` structure to create stubs for `0002` through `0011`
  - Verify `pnpm db:check` exits 0
  - Commit as `chore(db): add snapshot stubs for migrations 0002-0011`

  **Must NOT do**:
  - ❌ Modify any existing SQL migration file
  - ❌ Change `drizzle.config.ts`
  - ❌ Delete the existing `0000_snapshot.json` or `0001_snapshot.json`

  **Recommended Agent Profile**:
  - **Category**: `quick` — chore, single config file edit
  - **Skills**: `git-master` (atomic commit, no destructive ops)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (all 6 tasks)
  - **Blocks**: None (was needed for Track 7, now deferred)
  - **Blocked By**: None

  **References**:
  - `drizzle/meta/_journal.json` — already has all 12 entries (idx 0-11), only snapshots missing for 0002-0011
  - `drizzle/0000_exotic_next_avengers.sql` through `0011_rate_limits.sql` — migration files
  - Drizzle 0.45 docs on snapshot regeneration: https://orm.drizzle.team/docs/kit-overview

  **Acceptance Criteria**:
  - [ ] `pnpm db:check` exits 0
  - [ ] `drizzle/meta/_journal.json` has 12 entries (idx 0-11)
  - [ ] No `Date.now()` literal in JSON (use integer timestamp)
  - [ ] `.gitignore` keeps `drizzle/meta/*_snapshot.json` excluded EXCEPT the journal — verify per AGENTS.md lesson

  **QA Scenarios**:
  ```
  Scenario: drizzle-kit check passes
    Tool: Bash
    Preconditions: Working DATABASE_URL in env
    Steps:
      1. pnpm db:check
    Expected Result: exit 0, no "malformed snapshot" errors
    Evidence: .sisyphus/evidence/sprint3-snapshot-stubs/task-1-db-check.txt
  ```

  **Commit**: `chore(db): add snapshot stubs for migrations 0002-0011 (P7)`
  - Files: `drizzle/meta/*.json`
  - Pre-commit: `pnpm db:check`

- [ ] 2. **T2: Ramp coverage thresholds to Phase 2 targets**

  **What to do**:
  - Edit `vitest.config.ts` → `coverage.thresholds`: lines 38, branches 33, functions 36, statements 38
  - Run `pnpm test:coverage` to confirm current state vs new thresholds
  - If thresholds fail, document in draft which tests need to be added
  - Commit as `chore(vitest): ramp coverage thresholds to Phase 2 targets`

  **Must NOT do**:
  - ❌ Lower thresholds to current values (defeats the purpose)
  - ❌ Add `--passWithNoTests` flag

  **Recommended Agent Profile**:
  - **Category**: `quick` — single config edit
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: All tracks (CI gate)
  - **Blocked By**: None

  **References**:
  - `vitest.config.ts` — current coverage config
  - `.sisyphus/plans/tdd-workflow.md` §2.1 — Phase 1 thresholds (current), §3.1 — Phase 2 targets (this change)

  **Acceptance Criteria**:
  - [ ] `vitest.config.ts` has `thresholds: { lines: 38, branches: 33, functions: 36, statements: 38 }`
  - [ ] `pnpm test:coverage` exits non-zero (reveals current gap)
  - [ ] No test file changes in this commit

  **QA Scenarios**:
  ```
  Scenario: Coverage thresholds active
    Tool: Bash
    Steps:
      1. cat vitest.config.ts | grep -A5 thresholds
      2. pnpm test:coverage 2>&1 | tail -20
    Expected Result: shows threshold values, reveals current % (will fail until Wave 2 tracks close the gap)
    Evidence: .sisyphus/evidence/sprint3-foundation/task-2-coverage-baseline.txt
  ```

  **Commit**: `chore(vitest): ramp coverage thresholds to Phase 2 targets`
  - Files: `vitest.config.ts`
  - Pre-commit: `pnpm test:coverage`

- [ ] 3. **T3: P4 — Add onConflictDoUpdate to deals insert (TDD)**

  **What to do**:
  - RED: Write test in `src/actions/deals.test.ts` that calls `performIngestion` with same `(gameId, storeId)` twice → expects 1 row, 2nd call updates price
  - GREEN: Add `.onConflictDoUpdate({ target: [dealsTable.gameId, dealsTable.storeId], set: { price, retailPrice, savings, dealRating, url, createdAt: sql\`NOW()\` } })`
  - First ensure unique constraint exists in DB (migration if missing — check `0009_schema_optimization.sql` first)
  - If constraint missing, add hand-written migration `0012_deals_unique_constraint.sql`
  - Update Drizzle schema to add `uniqueIndex` on `(gameId, storeId)`
  - REFACTOR: extract `buildDealsInsertValues` upsert config to a constant
  - Commit sequence: `test(deals): add failing test for deals upsert on (gameId, storeId)` → `feat(deals): add onConflictDoUpdate for duplicate prevention` → `chore(db): add unique index on deals(gameId, storeId)` → `refactor(deals): extract upsert config to constant`

  **Must NOT do**:
  - ❌ Change other deal insert behavior
  - ❌ Drop the deals table
  - ❌ Use raw `ON CONFLICT` SQL — use Drizzle's `onConflictDoUpdate`

  **Recommended Agent Profile**:
  - **Category**: `quick` — single action + 1 migration
  - **Skills**: `git-master` (atomic commits, no destructive ops)

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T4, T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: Track 6 (cron tests for ingest-prices)
  - **Blocked By**: None

  **References**:
  - `src/actions/deals.ts:143-165` — `performIngestion` function (insert location: line 153)
  - `src/actions/deals.test.ts:7.3K` — existing test patterns
  - `drizzle/0009_schema_optimization.sql` — verify if unique constraint already exists
  - `src/db/schema/deals.ts:4-25` — pgTable definition (needs uniqueIndex)

  **Acceptance Criteria**:
  - [ ] Test exists: `src/actions/deals.test.ts` → "upserts on duplicate (gameId, storeId)" test passes
  - [ ] `pnpm test:coverage` shows deals.ts ≥80% line coverage
  - [ ] Migration `0012_deals_unique_constraint.sql` (if needed) applies cleanly via `pnpm db:push`
  - [ ] No duplicate rows after 2 consecutive `ingestPricesAction()` calls (manual verify with `psql`)

  **QA Scenarios**:
  ```
  Scenario: Upsert prevents duplicate deals
    Tool: Vitest
    Preconditions: Real test DB with deals table
    Steps:
      1. Run pnpm test deals.test.ts
      2. Assert test "upserts on duplicate (gameId, storeId)" passes
      3. Assert no console.error in test output
    Expected Result: 1 test passes, no duplicate row
    Evidence: .sisyphus/evidence/sprint3-deals-upsert/task-3-upsert-test.txt

  Scenario: Migration applies cleanly
    Tool: Bash (psql)
    Preconditions: DATABASE_URL set
    Steps:
      1. pnpm db:push
      2. psql $DATABASE_URL -c "\d deals" | grep -E "(gameId|storeId|UK)"
    Expected Result: Unique constraint visible on (gameId, storeId)
    Evidence: .sisyphus/evidence/sprint3-deals-upsert/task-3-migration.txt
  ```

  **Commit**: 3 atomic commits (test + feat + refactor) + 1 chore for migration
  - Files: `src/actions/deals.ts`, `src/actions/deals.test.ts`, `src/db/schema/deals.ts`, `drizzle/0012_deals_unique_constraint.sql`
  - Pre-commit: `pnpm test deals.test.ts && ./node_modules/.bin/tsc --noEmit`

- [ ] 4. **T4: P12 — Extract AlertCard sub-component from AlertsPage (TDD)**

  **What to do**:
  - RED: Write `src/components/AlertCard.test.tsx` testing AlertCard renders a single alert with thumb/title/target/current/store/remove/view buttons
  - GREEN: Create `src/components/AlertCard.tsx` — extract the card JSX (lines 119-194 of `src/app/alerts/page.tsx`) into a typed component accepting `PriceAlertWithGame` + `onRemove: (params) => void` + `isDeleting: boolean`
  - REFACTOR: Update `src/app/alerts/page.tsx` to import AlertCard, reduce from 201 → ~100 lines
  - Verify Fallow complexity drops (CC 13 → ≤8, CRAP 49.5 → ≤25)
  - Commit sequence: `test(alerts): add failing test for AlertCard component` → `feat(alerts): extract AlertCard sub-component` → `refactor(alerts): simplify AlertsPage to use AlertCard`

  **Must NOT do**:
  - ❌ Change alert deletion behavior
  - ❌ Move state from AlertsPage to AlertCard (keep state at page level)
  - ❌ Change `PriceAlertWithGame` type

  **Recommended Agent Profile**:
  - **Category**: `quick` — component extraction
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Track 5 (Alerts E2E), P10 (dual-storage fix)
  - **Blocked By**: None

  **References**:
  - `src/app/alerts/page.tsx:119-194` — card JSX to extract
  - `src/types/price-alert.ts` — `PriceAlertWithGame` type
  - `src/app/alerts/page.module.css` — existing styles
  - `src/components/GameCard.tsx` — similar pattern (read-only card)

  **Acceptance Criteria**:
  - [ ] `src/components/AlertCard.tsx` exists, <100 lines
  - [ ] `src/components/AlertCard.test.tsx` has 3+ tests (renders, onRemove, isDeleting state)
  - [ ] `src/app/alerts/page.tsx` reduced to ≤100 lines
  - [ ] `pnpm fallow:audit` shows AlertsPage CC ≤8
  - [ ] No visual regression (screenshot identical)

  **QA Scenarios**:
  ```
  Scenario: AlertCard renders alert data
    Tool: Vitest (jsdom)
    Steps:
      1. pnpm test AlertCard.test.tsx
    Expected Result: 3+ tests pass, AlertCard matches PriceAlertWithGame
    Evidence: .sisyphus/evidence/sprint3-alerts-page/task-4-alertcard-test.txt

  Scenario: Visual parity
    Tool: Playwright (visual)
    Steps:
      1. pnpm test:e2e:visual --update-snapshots
    Expected Result: Visual diff zero
    Evidence: .sisyphus/evidence/sprint3-alerts-page/task-4-visual.png
  ```

  **Commit**: 3 atomic commits (test + feat + refactor)
  - Files: `src/components/AlertCard.tsx`, `src/components/AlertCard.test.tsx`, `src/app/alerts/page.tsx`
  - Pre-commit: `pnpm test --changed && ./node_modules/.bin/biome check .`

- [ ] 5. **T5: P10 prep — alertStore test scaffold (TDD)**

  **What to do**:
  - RED: Write `src/store/alertStore.test.ts` testing `useAlerts` store: addAlert, removeAlert, hasAlert, getAlert, setAlertId
  - GREEN: Add mock localStorage via `vi.mock('zustand/middleware')` pattern (or jsdom `localStorage`)
  - Commit as `test(store): add unit tests for alertStore`

  **Must NOT do**:
  - ❌ Refactor alertStore.ts itself (defer to P10)
  - ❌ Change store API

  **Recommended Agent Profile**:
  - **Category**: `quick` — test-only
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: P10 implementation (need tests to verify refactor preserves behavior)
  - **Blocked By**: None

  **References**:
  - `src/store/alertStore.ts:1-45` — store implementation
  - `src/store/wishlistStore.test.ts` (if exists) — pattern for Zustand tests
  - Zustand testing docs: https://docs.pmnd.rs/zustand/guides/testing

  **Acceptance Criteria**:
  - [ ] `src/store/alertStore.test.ts` has 5+ tests (one per method)
  - [ ] `pnpm test alertStore.test.ts` passes
  - [ ] No changes to `alertStore.ts`

  **QA Scenarios**:
  ```
  Scenario: alertStore methods work
    Tool: Vitest (node)
    Steps:
      1. pnpm test alertStore.test.ts
    Expected Result: 5+ tests pass
    Evidence: .sisyphus/evidence/sprint3-alerts-dedup/task-5-store-test.txt
  ```

  **Commit**: `test(store): add unit tests for alertStore`
  - Files: `src/store/alertStore.test.ts` (new)
  - Pre-commit: `pnpm test alertStore.test.ts`

- [ ] 6. **T6: Install dependencies for PWA, Theme, Analytics tracks**

  **What to do**:
  - Run `pnpm add serwist next-themes posthog-js posthog-node`
  - Run `pnpm add -D @types/node` (if needed for serwist types)
  - Update `.env.example`:
    - `NEXT_PUBLIC_POSTHOG_KEY=`
    - `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
  - Verify `package.json` shows all 3 new deps
  - Commit as `chore(deps): add serwist, next-themes, posthog-js`

  **Must NOT do**:
  - ❌ Add any new devDeps not in the 3-package list
  - ❌ Modify lockfile by hand
  - ❌ Add real API keys to `.env.local` (user does this manually)

  **Recommended Agent Profile**:
  - **Category**: `quick` — package install
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tracks 1, 2, 4
  - **Blocked By**: None

  **References**:
  - `package.json` — current deps
  - `.env.example` — current env template
  - AGENTS.md lesson on `.env` naming mismatch (P22)

  **Acceptance Criteria**:
  - [ ] `package.json` shows `serwist`, `next-themes`, `posthog-js` in `dependencies`
  - [ ] `pnpm install` exits 0
  - [ ] `.env.example` has `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
  - [ ] `./node_modules/.bin/tsc --noEmit` still passes (no type errors from new deps)

  **QA Scenarios**:
  ```
  Scenario: Deps installed cleanly
    Tool: Bash
    Steps:
      1. pnpm install
      2. cat package.json | grep -E "(serwist|next-themes|posthog-js)"
      3. ./node_modules/.bin/tsc --noEmit
    Expected Result: 3 packages in deps, no type errors
    Evidence: .sisyphus/evidence/sprint3-foundation/task-6-deps.txt
  ```

  **Commit**: `chore(deps): add serwist, next-themes, posthog-js`
  - Files: `package.json`, `pnpm-lock.yaml`, `.env.example`
  - Pre-commit: `pnpm install && ./node_modules/.bin/tsc --noEmit`

---

### Wave 2 — 8 Parallel Feature Tracks (After Wave 1)

> Each track is an independent feature branch (`feat/sprint3-{track}`). Run all 8 in parallel where agent capacity allows. Max 6 concurrent (Tracks 7 + 8 are the most complex).

#### Track 1: PWA Service Worker (2d) — `feat/sprint3-pwa-sw`

- [ ] 7. **T1.1: Serwist config + service worker registration**

  **What to do**:
  - RED: Write test that asserts `sw.js` is served from `/sw.js` with `Service-Worker-Allowed: /` header
  - GREEN: Create `src/app/sw.ts` with Serwist precache + runtime caching config
  - Create `src/app/manifest.ts` (Next.js 16 native) generating Web App Manifest
  - Add to `next.config.ts`: `import withSerwistInit from '@serwist/next'` wrapper
  - Add `instrumentation.ts` registering `serwist` (Next.js 16 native pattern)
  - Update `src/app/layout.tsx` to add `<link rel="manifest" href="/manifest.webmanifest">`
  - Verify Service Worker registers in DevTools → Application tab
  - Commit sequence: `test(pwa): add failing test for service worker registration` → `feat(pwa): add Serwist service worker with precache` → `feat(pwa): add manifest.ts for PWA metadata` → `chore(next): wrap next.config.ts with withSerwistInit`

  **Must NOT do**:
  - ❌ Use `next-pwa` library (deprecated)
  - ❌ Hand-roll service worker (use Serwist/Workbox)
  - ❌ Cache `/api/cron/*` routes (security)
  - ❌ Cache authenticated pages (`/wishlist`, `/alerts`)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` (PWA is frontend)
  - **Skills**: `playwright` (verify registration, offline mode)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tracks 2-8)
  - **Blocks**: T1.2, T1.3, T1.4
  - **Blocked By**: T6 (deps install)

  **References**:
  - Serwist Next 16 docs: https://serwist.pages.dev/docs/next/getting-started
  - `src/app/layout.tsx` — current root layout (add manifest link)
  - `next.config.ts` — current config
  - AGENTS.md PWA manifest lesson (icons must exist, not just manifest)

  **Acceptance Criteria**:
  - [ ] `/sw.js` returns 200 with `application/javascript` content-type
  - [ ] `/manifest.webmanifest` returns 200 with `application/manifest+json` content-type
  - [ ] Service worker registers on first page load (DevTools shows `sw.js` as activated)
  - [ ] Lighthouse PWA audit ≥ 80

  **QA Scenarios**:
  ```
  Scenario: Service worker registers
    Tool: Playwright
    Preconditions: Production build (pnpm build && pnpm start)
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for service worker registration: await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 10000 })
      3. Check sw.js status: curl -I http://localhost:3000/sw.js
    Expected Result: SW controller non-null, sw.js returns 200
    Evidence: .sisyphus/evidence/sprint3-pwa-sw/task-7-sw-registration.png

  Scenario: Manifest serves correctly
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/manifest.webmanifest | jq .
    Expected Result: JSON with name, short_name, icons (192, 512), display: standalone
    Evidence: .sisyphus/evidence/sprint3-pwa-sw/task-7-manifest.json
  ```

  **Commit**: 4 atomic commits (test + 3 feat)
  - Files: `src/app/sw.ts`, `src/app/manifest.ts`, `next.config.ts`, `src/app/layout.tsx`, `instrumentation.ts`
  - Pre-commit: `pnpm build && pnpm test --changed`

- [ ] 8. **T1.2: Runtime caching strategies (stale-while-revalidate)**

  **What to do**:
  - RED: Write test for `CacheFirst` strategy on `/_next/static/*` and `StaleWhileRevalidate` on `/api/*` GET (non-cron)
  - GREEN: Add to `src/app/sw.ts`: registerRoute for:
    - `CacheFirst`: `/_next/static/*`, fonts, icons
    - `StaleWhileRevalidate`: `/api/*` (exclude `/api/cron/*`)
    - `NetworkFirst`: HTML pages (fallback to cache when offline)
  - Commit as `feat(pwa): add runtime caching strategies for static, API, HTML`

  **Must NOT do**:
  - ❌ Cache POST/PUT/DELETE (only GET)
  - ❌ Cache cron routes (security risk)
  - ❌ Use `CacheOnly` (breaks offline detection)

  **Recommended Agent Profile**:
  - **Category**: `quick` — config addition
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T1.3
  - **Blocked By**: T1.1

  **Acceptance Criteria**:
  - [ ] Test: cached static asset served from CacheStorage on 2nd request
  - [ ] Test: `/api/*` returns cached + fetches fresh in background
  - [ ] No `/api/cron/*` in SW cache
  - [ ] Lighthouse "Uses HTTPS" + "Has a service worker" audits pass

  **QA Scenarios**:
  ```
  Scenario: Offline HTML fallback
    Tool: Playwright
    Preconditions: First visit (SW active), then go offline
    Steps:
      1. Visit /, wait for SW
      2. page.context().setOffline(true)
      3. Reload /, assert page still loads (from cache)
      4. page.context().setOffline(false)
    Expected Result: Page renders from cache when offline
    Evidence: .sisyphus/evidence/sprint3-pwa-sw/task-8-offline.png
  ```

  **Commit**: `feat(pwa): add runtime caching strategies for static, API, HTML`
  - Files: `src/app/sw.ts`
  - Pre-commit: `pnpm build`

- [ ] 9. **T1.3: Install prompt + offline fallback page**

  **What to do**:
  - RED: Write test for `useInstallPrompt` hook capturing `beforeinstallprompt` event
  - GREEN: Create `src/hooks/useInstallPrompt.ts` with `canInstall: boolean` + `promptInstall(): Promise<boolean>`
  - Create `src/components/InstallPWAButton.tsx` — renders only when `canInstall` is true
  - Create `src/app/~offline/page.tsx` — fallback page for offline navigation
  - Wire InstallPWAButton into `src/components/Navbar.tsx`
  - Commit sequence: `test(pwa): add failing test for install prompt hook` → `feat(pwa): add useInstallPrompt hook and InstallPWAButton` → `feat(pwa): add /~offline fallback page`

  **Must NOT do**:
  - ❌ Auto-prompt on page load (only on user action)
  - ❌ Use a 3rd-party install library
  - ❌ Show install button on iOS Safari (no support)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T-INT3 (Lighthouse audit)
  - **Blocked By**: T1.2

  **Acceptance Criteria**:
  - [ ] `useInstallPrompt` hook tested (2+ tests)
  - [ ] InstallPWAButton visible only when `canInstall` is true
  - [ ] `/~offline` page renders when offline and navigating to uncached URL
  - [ ] Manual test: install button appears in Chrome address bar (Lighthouse PWA ≥80)

  **QA Scenarios**:
  ```
  Scenario: Install prompt shows in Chrome
    Tool: Playwright
    Preconditions: Chrome browser, app meets install criteria
    Steps:
      1. Visit /, wait for SW
      2. Simulate beforeinstallprompt event
      3. Assert InstallPWAButton becomes visible
    Expected Result: Button renders, has correct aria-label
    Evidence: .sisyphus/evidence/sprint3-pwa-sw/task-9-install-prompt.png
  ```

  **Commit**: 3 atomic commits (test + 2 feat)
  - Files: `src/hooks/useInstallPrompt.ts`, `src/components/InstallPWAButton.tsx`, `src/app/~offline/page.tsx`, `src/components/Navbar.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 10. **T1.4: PWA icons (192/512 PNG) + Lighthouse verification**

  **What to do**:
  - Create `public/icon-192.png` and `public/icon-512.png` using ImageMagick: `convert -size 192x192 xc:'#16a34a' public/icon-192.png`
  - Update `manifest.ts` to reference `public/icons/` (Apple touch icon, maskable)
  - Add to `src/app/layout.tsx` metadata: `appleWebApp: { capable: true, statusBarStyle: 'black-translucent' }`
  - Run `npx lhci autorun --collect.staticDistDir=.next --assert.assertions.categories:pwa=[80,100]`
  - Commit sequence: `chore(pwa): add 192/512 PNG icons` → `feat(pwa): add appleWebApp metadata for iOS PWA` → `docs(pwa): document Lighthouse PWA score in evidence`

  **Must NOT do**:
  - ❌ Use SVG (must be PNG for install criteria)
  - ❌ Skip Lighthouse run (must verify ≥80)
  - ❌ Create icons in `src/app/` (must be `public/`)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` + `quick` (Lighthouse)
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T-INT3
  - **Blocked By**: T1.3

  **Acceptance Criteria**:
  - [ ] `public/icon-192.png` and `public/icon-512.png` exist (verified by `file` command)
  - [ ] `manifest.ts` references both icons
  - [ ] Lighthouse PWA category ≥80

  **QA Scenarios**:
  ```
  Scenario: Lighthouse PWA passes
    Tool: Lighthouse CLI
    Preconditions: pnpm build && pnpm start (production server)
    Steps:
      1. npx lhci autorun --collect.staticDistDir=.next --assert.assertions.categories:pwa=[80,100]
    Expected Result: Lighthouse PWA score ≥80
    Evidence: .sisyphus/evidence/sprint3-pwa-sw/task-10-lighthouse.json
  ```

  **Commit**: 3 atomic commits (chore + feat + docs)
  - Files: `public/icon-192.png`, `public/icon-512.png`, `src/app/manifest.ts`, `src/app/layout.tsx`
  - Pre-commit: `pnpm build`

#### Track 2: Theme Toggle / Light Mode (2d) — `feat/sprint3-theme`

- [ ] 11. **T2.1: next-themes provider + system preference detection**

  **What to do**:
  - RED: Write test for `ThemeProvider` applying `class="dark"` or `class="light"` to `<html>` based on localStorage/system pref
  - GREEN: Create `src/components/ThemeProvider.tsx` wrapping `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - Update `src/app/layout.tsx`:
    - Add `suppressHydrationWarning` to `<html>` (per next-themes requirement)
    - Wrap children with `<ThemeProvider>`
  - Add Tailwind v4 `dark:` variants to `src/app/globals.css` (verify they exist)
  - Commit sequence: `test(theme): add failing test for ThemeProvider class application` → `feat(theme): add next-themes ThemeProvider with system detection` → `feat(theme): add suppressHydrationWarning to root html`

  **Must NOT do**:
  - ❌ Build a custom theme provider (use next-themes)
  - ❌ Use `prefers-color-scheme` media strategy (use class strategy)
  - ❌ Force dark as default (let user choose)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T2.2, T2.3
  - **Blocked By**: T6 (deps install)

  **References**:
  - next-themes docs: https://github.com/pacocoursey/next-themes
  - `src/app/layout.tsx` — root layout
  - `src/app/globals.css` — current CSS (no light mode)

  **Acceptance Criteria**:
  - [ ] Test: `document.documentElement.classList` contains `dark` when system pref is dark
  - [ ] Test: localStorage `theme` = `light` applies light class
  - [ ] No hydration mismatch warning in console
  - [ ] All existing components still render in light mode (background changes from black→white)

  **QA Scenarios**:
  ```
  Scenario: Theme applies from system preference
    Tool: Playwright
    Preconditions: OS dark mode enabled
    Steps:
      1. Visit /, wait for hydration
      2. await page.evaluate(() => document.documentElement.classList.contains('dark'))
    Expected Result: returns true
    Evidence: .sisyphus/evidence/sprint3-theme/task-11-system-dark.png

  Scenario: No hydration mismatch
    Tool: Bash
    Preconditions: pnpm build && pnpm start
    Steps:
      1. curl -s http://localhost:3000 | grep "suppressHydrationWarning"
      2. Check page.goto in Playwright for console errors
    Expected Result: No "Hydration failed" errors
    Evidence: .sisyphus/evidence/sprint3-theme/task-11-no-hydration-error.txt
  ```

  **Commit**: 3 atomic commits (test + 2 feat)
  - Files: `src/components/ThemeProvider.tsx`, `src/app/layout.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 12. **T2.2: Theme toggle button + dropdown UI**

  **What to do**:
  - RED: Write test for `ThemeToggle` component rendering Sun/Moon icons and switching theme on click
  - GREEN: Create `src/components/ThemeToggle.tsx`:
    - Use `useTheme` from next-themes
    - 3 options: Light / Dark / System (dropdown) OR simple cycle button
    - Simple cycle (Sun → Moon → System) for MVP
  - Add `ThemeToggle` to `src/components/Navbar.tsx` (next to UserMenu)
  - Commit sequence: `test(theme): add failing test for ThemeToggle component` → `feat(theme): add ThemeToggle with sun/moon icons` → `feat(theme): wire ThemeToggle into Navbar`

  **Must NOT do**:
  - ❌ Use a 3rd-party toggle library
  - ❌ Store theme in localStorage manually (next-themes handles it)
  - ❌ Render toggle before mount (causes hydration mismatch)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T2.3
  - **Blocked By**: T2.1

  **References**:
  - `src/components/Navbar.tsx` — current nav structure
  - `lucide-react` — Sun/Moon icons already in deps
  - next-themes `useTheme` hook

  **Acceptance Criteria**:
  - [ ] ThemeToggle has 3+ tests (renders, switches, persists)
  - [ ] Clicking toggle cycles through Light → Dark → System
  - [ ] Theme persists across page reloads (localStorage)
  - [ ] Visual snapshot matches in all 3 themes

  **QA Scenarios**:
  ```
  Scenario: Theme toggle cycles
    Tool: Playwright
    Steps:
      1. Visit /, wait for hydration
      2. Click ThemeToggle
      3. Assert document.documentElement.classList contains 'dark'
      4. Click again, assert 'light'
      5. Click again, assert system pref applied
      6. Reload, assert theme persists
    Expected Result: Theme cycles, persists across reload
    Evidence: .sisyphus/evidence/sprint3-theme/task-12-toggle-cycle.png
  ```

  **Commit**: 3 atomic commits (test + 2 feat)
  - Files: `src/components/ThemeToggle.tsx`, `src/components/ThemeToggle.test.tsx`, `src/components/Navbar.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 13. **T2.3: Tailwind v4 dark variant + component audit**

  **What to do**:
  - Audit all `src/components/**/*.module.css` for hardcoded dark colors (`#000`, `bg-black`, etc.)
  - Add `dark:` Tailwind variants to globals.css OR use CSS custom properties with light/dark values
  - Use Tailwind v4 `@variant dark` directive in `globals.css`
  - Test: switch theme in Playwright, take screenshot, compare to baseline
  - Commit sequence: `feat(theme): add dark variant to Tailwind v4 globals.css` → `refactor(theme): migrate hardcoded dark colors to CSS variables` → `test(theme): add Playwright visual regression for light mode`

  **Must NOT do**:
  - ❌ Use `prefers-color-scheme` in components (only class-based dark)
  - ❌ Add inline `style={{ color: ... }}` (use Tailwind/CSS vars)
  - ❌ Break existing dark mode visuals

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright` (visual regression)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T2.2

  **References**:
  - `src/app/globals.css` — current CSS
  - `src/app/tokens.css` — design tokens
  - Tailwind v4 dark mode: https://tailwindcss.com/docs/dark-mode

  **Acceptance Criteria**:
  - [ ] `@variant dark (.dark &)` in globals.css
  - [ ] All existing components render in light mode without broken styles
  - [ ] Visual regression test passes for both themes
  - [ ] No new `console.error` in light mode

  **QA Scenarios**:
  ```
  Scenario: Light mode renders correctly
    Tool: Playwright
    Steps:
      1. Set theme=light via localStorage
      2. Visit /, take screenshot
      3. Compare to baseline (update if intentional change)
    Expected Result: White background, dark text, no broken layouts
    Evidence: .sisyphus/evidence/sprint3-theme/task-13-light-mode.png
  ```

  **Commit**: 3 atomic commits
  - Files: `src/app/globals.css`, `src/app/tokens.css`, `src/components/**/*.module.css` (as needed)
  - Pre-commit: `pnpm test:e2e:visual`

#### Track 3: Store Filter Cap Removal (1d) — `feat/sprint3-store-filter`

- [ ] 14. **T3.1: Searchable store combobox (no cap)**

  **What to do**:
  - RED: Write test for `StoreFilter` component: renders all stores, search filters, multi-select
  - GREEN: Create `src/components/StoreFilter.tsx`:
    - Accept `stores: StoreInfo[]` (no cap)
    - Search input with debounced filter (200ms)
    - Multi-select via checkboxes
    - "Show more" or scroll for 30+ stores
  - Remove hardcoded `s.storeID) <= 25` cap from `src/components/FilterSidebar.tsx:93`
  - Wire new StoreFilter into FilterSidebar
  - Commit sequence: `test(filter): add failing test for StoreFilter with all stores` → `feat(filter): add StoreFilter with search and multi-select` → `refactor(filter): remove 25-store cap from FilterSidebar`

  **Must NOT do**:
  - ❌ Use a 3rd-party combobox library (build it)
  - ❌ Keep the 25-store cap
  - ❌ Change `StoreInfo` shape

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: None (no deps)

  **References**:
  - `src/components/FilterSidebar.tsx:7-114` — current implementation
  - `src/components/FilterSidebar.module.css` — existing styles
  - 25-store cap: `src/components/FilterSidebar.tsx:93` `Number.parseInt(s.storeID, 10) <= 25`

  **Acceptance Criteria**:
  - [ ] StoreFilter renders all 30+ stores without cap
  - [ ] Search filters stores by name (case-insensitive)
  - [ ] Multi-select persists via URL params (`storeID=a,b,c`)
  - [ ] E2E test: search "Steam", select 3 stores, navigate to /search, assert results

  **QA Scenarios**:
  ```
  Scenario: Search filters stores
    Tool: Playwright
    Steps:
      1. Visit /search
      2. Type "Steam" in store search
      3. Assert only Steam-related stores visible
      4. Clear search, assert all stores return
    Expected Result: Filtering works, no scroll needed for small lists
    Evidence: .sisyphus/evidence/sprint3-store-filter/task-14-search.png

  Scenario: Multi-select persists to URL
    Tool: Playwright
    Steps:
      1. Visit /search
      2. Select 3 stores, click Apply
      3. Assert URL contains storeID=1,2,3
      4. Reload, assert 3 stores still selected
    Expected Result: URL state survives reload
    Evidence: .sisyphus/evidence/sprint3-store-filter/task-14-url-state.png
  ```

  **Commit**: 3 atomic commits (test + feat + refactor)
  - Files: `src/components/StoreFilter.tsx`, `src/components/StoreFilter.test.tsx`, `src/components/FilterSidebar.tsx`
  - Pre-commit: `pnpm test --changed`

#### Track 4: Custom Analytics Events (2d) — `feat/sprint3-analytics`

- [ ] 15. **T4.1: PostHog init via Next.js 16 instrumentation**

  **What to do**:
  - RED: Write test for `posthog-js` provider initializing on page load
  - GREEN: Create `src/lib/posthog.ts` with `posthog-js` init (client) using `NEXT_PUBLIC_POSTHOG_KEY`
  - Create `src/app/instrumentation-client.ts` (Next.js 16 native pattern)
  - Wire PostHog init into `src/app/layout.tsx` via `PostHogProvider` (client wrapper)
  - Verify `posthog.init()` called on app load
  - Commit sequence: `test(analytics): add failing test for PostHog provider init` → `feat(analytics): add PostHog client init via instrumentation-client.ts` → `feat(analytics): add PostHogProvider wrapper in root layout`

  **Must NOT do**:
  - ❌ Use Vercel Analytics (decision: PostHog only)
  - ❌ Add PostHog server-side (only client)
  - ❌ Hardcode API key (must be env var)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (analytics integration is multi-file)
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T4.2, T4.3, T4.4
  - **Blocked By**: T6 (deps install)

  **References**:
  - PostHog Next.js docs: https://posthog.com/docs/libraries/next-js
  - Next.js 16 `instrumentation-client.ts`: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
  - `.env.example` — needs `NEXT_PUBLIC_POSTHOG_KEY`

  **Acceptance Criteria**:
  - [ ] PostHog initializes on app load (visible in network tab: `posthog.com/decide` or `/capture`)
  - [ ] Test: PostHog provider wraps children
  - [ ] No env var warnings in dev console
  - [ ] Production build still works (PostHog tree-shaken if no key)

  **QA Scenarios**:
  ```
  Scenario: PostHog initializes
    Tool: Playwright
    Preconditions: NEXT_PUBLIC_POSTHOG_KEY set in .env.local
    Steps:
      1. Visit /
      2. Wait 2s
      3. page.on('request', req => req.url().includes('posthog') && console.log(req.url()))
      4. Assert at least 1 PostHog request fired
    Expected Result: PostHog init request visible
    Evidence: .sisyphus/evidence/sprint3-analytics/task-15-posthog-init.png
  ```

  **Commit**: 3 atomic commits (test + 2 feat)
  - Files: `src/lib/posthog.ts`, `src/app/instrumentation-client.ts`, `src/app/layout.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 16. **T4.2: Page view + custom event helpers**

  **What to do**:
  - RED: Write test for `trackEvent` helper calling `posthog.capture()` with correct payload
  - GREEN: Create `src/lib/analytics.ts` with:
    - `trackPageView(url: string)`: client-side, calls `posthog.capture('$pageview', { $current_url: url })` via `posthog-js`
    - `trackEvent(name: string, props?: Record<string, unknown>)`: client-side, calls `posthog.capture(name, props)` via `posthog-js`
    - `trackServerEvent(name: string, props: Record<string, unknown>)`: server-side, calls PostHog `/capture/` API via `posthog-node` (for Edge/Node route handlers — NOT posthog-js which is browser-only)
  - Wire page view tracking into `src/app/layout.tsx` (client component or `useEffect` in a wrapper)
  - Commit sequence: `test(analytics): add failing test for trackEvent helper` → `feat(analytics): add trackPageView and trackEvent helpers` → `feat(analytics): wire page view tracking in root layout`

  **Must NOT do**:
  - ❌ Track PII (user email, ID) without hashing
  - ❌ Track on every render (only on route change)
  - ❌ Send data to non-PostHog endpoints

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T4.3, T4.4
  - **Blocked By**: T4.1

  **References**:
  - PostHog events docs: https://posthog.com/docs/data/events
  - `src/app/layout.tsx` — root layout

  **Acceptance Criteria**:
  - [ ] trackEvent test: calls posthog.capture with correct name + props
  - [ ] trackPageView fires on every route change (test in Playwright)
  - [ ] No duplicate page view events on same URL

  **QA Scenarios**:
  ```
  Scenario: Page view fires on navigation
    Tool: Playwright
    Steps:
      1. Visit /, wait 1s
      2. Click nav to /search, wait 1s
      3. Capture network: page.on('request', req => req.url().includes('/capture') && console.log(req.url()))
      4. Assert 2 distinct $pageview events
    Expected Result: One event per route
    Evidence: .sisyphus/evidence/sprint3-analytics/task-16-page-views.png
  ```

  **Commit**: 3 atomic commits (test + 2 feat)
  - Files: `src/lib/analytics.ts`, `src/lib/analytics.test.ts`, `src/app/layout.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 17. **T4.3: Affiliate click tracking (server-side)**

  **What to do**:
  - RED: Write test for affiliate click triggering `affiliate_click` event with `store_id`, `game_slug`
  - GREEN: Update `src/app/out/[storeId]/[gameSlug]/route.ts` to call `trackServerEvent('affiliate_click', { store_id, game_slug })` BEFORE redirect
  - Use `posthog-node` (NOT `posthog-js` — browser-only, crashes in Edge/Node.js runtime)
  - Fire-and-forget via `fetch` to PostHog's capture API (no blocking redirect)
  - Commit sequence: `test(analytics): add failing test for affiliate click event` → `feat(analytics): track affiliate clicks server-side via posthog-node`

  **Must NOT do**:
  - ❌ Use `posthog-js` in route handler (browser-only — no `window` in Edge)
  - ❌ Block redirect on analytics (best-effort, fire-and-forget)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T4.2

  **References**:
  - `src/app/out/[storeId]/[gameSlug]/route.ts` — current redirect route
  - `src/lib/analytics.ts` — created in T4.2 (add `trackServerEvent` using `posthog-node`)

  **Acceptance Criteria**:
  - [ ] `affiliate_click` event fires on every `/out/*` redirect (server-side)
  - [ ] Event has `store_id` and `game_slug` properties
  - [ ] Redirect still executes (analytics non-blocking)

  **QA Scenarios**:
  ```
  Scenario: Affiliate click tracked
    Tool: Playwright
    Steps:
      1. Visit a game page with affiliate link
      2. Set up network listener for posthog /capture
      3. Click affiliate link
      4. Assert 1 affiliate_click event with correct store_id
    Expected Result: Event captured, redirect happens
    Evidence: .sisyphus/evidence/sprint3-analytics/task-17-affiliate-click.png
  ```

  **Commit**: 2 atomic commits (test + feat)
  - Files: `src/app/out/[storeId]/[gameSlug]/route.ts`, `src/app/out/[storeId]/[gameSlug]/route.test.ts`
  - Pre-commit: `pnpm test --changed`

- [ ] 18. **T4.4: Alert trigger event tracking**

  **What to do**:
  - RED: Write test for `alert_triggered` event firing from cron route when alerts are triggered
  - GREEN: Update `src/app/api/cron/check-alerts/route.ts` to call `trackEvent('alert_triggered', { user_id, game_id, target_price, current_price })` for each triggered alert
  - Add to `src/lib/analytics.ts`: `trackAlertTriggered(payload)` helper
  - Commit sequence: `test(analytics): add failing test for alert_triggered event` → `feat(analytics): track alert triggers in check-alerts cron route`

  **Must NOT do**:
  - ❌ Send alert events from client (privacy)
  - ❌ Log to console (use Sentry + PostHog)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T4.2

  **References**:
  - `src/app/api/cron/check-alerts/route.ts` — current route
  - `src/lib/analytics.ts` — created in T4.2

  **Acceptance Criteria**:
  - [ ] `alert_triggered` event fires from check-alerts route for each triggered alert
  - [ ] Event has `user_id`, `game_id`, `target_price`, `current_price`
  - [ ] Cron route still returns 200 with correct count

  **QA Scenarios**:
  ```
  Scenario: Alert trigger tracked
    Tool: Vitest (mock posthog)
    Steps:
      1. Mock checkTriggeredAlertsAction to return 1 triggered alert
      2. Call GET /api/cron/check-alerts
      3. Assert trackEvent called with 'alert_triggered' + correct payload
    Expected Result: Event captured
    Evidence: .sisyphus/evidence/sprint3-analytics/task-18-alert-event.txt
  ```

  **Commit**: 2 atomic commits (test + feat)
  - Files: `src/app/api/cron/check-alerts/route.ts`, `src/lib/analytics.ts`
  - Pre-commit: `pnpm test --changed`

#### Track 5: Alerts CRUD E2E Test (4h) — `feat/sprint3-alerts-e2e`

- [ ] 19. **T5.1: Supabase auth fixture for E2E**

  **What to do**:
  - Create `tests/e2e/fixtures/auth.ts` with helper to sign in as test user
  - Use `supabase.auth.signInWithPassword` with seeded test credentials from env (`E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`)
  - Inject session cookies into Playwright browser context
  - RED: Write `tests/e2e/fixtures/auth.test.ts` that verifies the fixture creates a valid session
  - Commit as `test(e2e): add Supabase auth fixture for Playwright`

  **Must NOT do**:
  - ❌ Hardcode credentials in test
  - ❌ Use real user accounts (must be seeded test user)
  - ❌ Skip auth check (test must verify session is active)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T5.2
  - **Blocked By**: T4 (AlertCard extraction — E2E will use new component)

  **References**:
  - Supabase Playwright auth pattern: https://supabase.com/docs/guides/auth/testing
  - `tests/e2e/alerts.spec.ts` — existing smoke test
  - `playwright.config.ts` — current config

  **Acceptance Criteria**:
  - [ ] `tests/e2e/fixtures/auth.ts` exports `signInAsTestUser(page: Page)` helper
  - [ ] Fixture test passes when seeded test user exists
  - [ ] No leaked credentials in test output

  **QA Scenarios**:
  ```
  Scenario: Auth fixture works
    Tool: Playwright
    Preconditions: E2E_TEST_EMAIL + E2E_TEST_PASSWORD in env, seeded test user in Supabase
    Steps:
      1. Run pnpm test:e2e --grep "auth fixture"
    Expected Result: Test passes, session cookies injected
    Evidence: .sisyphus/evidence/sprint3-alerts-e2e/task-19-fixture.txt
  ```

  **Commit**: `test(e2e): add Supabase auth fixture for Playwright`
  - Files: `tests/e2e/fixtures/auth.ts`, `tests/e2e/fixtures/auth.test.ts`
  - Pre-commit: `pnpm test:e2e --grep "auth fixture"`

- [ ] 20. **T5.2: Alerts CRUD E2E test (create → list → delete)**

  **What to do**:
  - RED: Write `tests/e2e/alerts-crud.spec.ts`:
    1. Sign in as test user
    2. Navigate to a game page (`/game/123`)
    3. Click "Set Alert" button
    4. Fill target price, click Save
    5. Navigate to `/alerts`
    6. Assert alert card appears with correct title
    7. Click Remove
    8. Assert card disappears
  - GREEN: Implement the test (no production code change unless gaps found)
  - Add to `playwright.config.ts` projects: `[chromium-e2e-crud]` if needed for separate DB
  - Commit as `test(e2e): add alerts CRUD end-to-end test`

  **Must NOT do**:
  - ❌ Skip auth step (must test full flow)
  - ❌ Hardcode game IDs (use a real existing game)
  - ❌ Mock DB (test against real Supabase)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T-INT1
  - **Blocked By**: T5.1, T4 (AlertCard)

  **References**:
  - `tests/e2e/alerts.spec.ts` — existing smoke tests
  - `src/components/AlertCard.tsx` — T4 deliverable
  - `src/app/alerts/page.tsx` — page under test
  - AGENTS.md Playwright RSC streaming lessons (font blocking, etc.)

  **Acceptance Criteria**:
  - [ ] E2E test passes in CI (with Supabase + Vercel preview)
  - [ ] Test covers full CRUD: create alert, verify in list, delete, verify removed
  - [ ] No manual intervention needed (fully automated)
  - [ ] Test runtime <60s

  **QA Scenarios**:
  ```
  Scenario: Full alert CRUD
    Tool: Playwright
    Preconditions: Test user seeded, dev server running
    Steps:
      1. pnpm test:e2e --grep "alerts CRUD"
    Expected Result: Test passes, evidence captured
    Evidence: .sisyphus/evidence/sprint3-alerts-e2e/task-20-crud.png
  ```

  **Commit**: `test(e2e): add alerts CRUD end-to-end test`
  - Files: `tests/e2e/alerts-crud.spec.ts`, `playwright.config.ts`
  - Pre-commit: `pnpm test:e2e --grep "alerts CRUD"`

#### Track 6: Cron Route Unit Test Expansion (2d) — `feat/sprint3-cron-tests`

> Existing cron route tests exist (per P1 in technical-debt.md). This track **expands coverage to ≥80%** and adds missing test cases (timeout, Sentry capture, edge cases).

- [ ] 21. **T6.1: Add timeout + Sentry tests to all 3 cron routes**

  **What to do**:
  - RED: Write tests for `ingest-prices`, `reindex-typesense`, `check-alerts` covering:
    - Timeout case (Promise.race rejects with CronError)
    - Sentry.captureException called on error
    - Console.error called on failure
    - 500 status on failure (not 200)
  - GREEN: Tests pass (no production code change)
  - Use `vi.useFakeTimers()` for timeout test
  - Commit as `test(cron): add timeout and Sentry capture tests to all 3 routes`

  **Must NOT do**:
  - ❌ Change cron route logic
  - ❌ Add real Sentry mock (use `vi.mock('@sentry/nextjs')`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T6.2
  - **Blocked By**: T3 (P4 deals upsert — affects ingest-prices test)

  **References**:
  - `src/app/api/cron/ingest-prices/route.test.ts` — existing tests
  - `src/app/api/cron/reindex-typesense/route.test.ts` — existing tests
  - `src/app/api/cron/check-alerts/route.test.ts` — existing tests
  - `src/app/api/cron/_lib/errors.ts` — CronError

  **Acceptance Criteria**:
  - [ ] 3+ new tests per route (timeout, Sentry, console)
  - [ ] All cron route tests pass
  - [ ] Coverage for cron routes ≥80% (was ~60%)

  **QA Scenarios**:
  ```
  Scenario: Cron timeout triggers CronError
    Tool: Vitest
    Steps:
      1. Mock action to never resolve
      2. Use vi.useFakeTimers() to advance time
      3. Call GET /api/cron/ingest-prices
      4. Assert response status 500 + code 'TIMEOUT'
    Expected Result: CronError caught, structured error response
    Evidence: .sisyphus/evidence/sprint3-cron-tests/task-21-timeout.txt
  ```

  **Commit**: `test(cron): add timeout and Sentry capture tests to all 3 routes`
  - Files: `src/app/api/cron/*/route.test.ts` (additions)
  - Pre-commit: `pnpm test --changed`

- [ ] 22. **T6.2: Add edge case tests (auth bypass attempts, malformed bodies)**

  **What to do**:
  - RED: Write tests for:
    - Auth bypass: `Bearer valid-secret` AND `valid-secret` (without `Bearer`) should both work
    - Auth rejection: empty header, wrong scheme, expired token
    - Edge: extremely long header (>1MB)
    - Edge: POST/PUT method (should be 405 or accepted?)
  - GREEN: Tests pass
  - Commit as `test(cron): add edge case tests for auth and HTTP methods`

  **Must NOT do**:
  - ❌ Loosen auth check (security)
  - ❌ Accept POST (cron is GET-only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T6.1

  **References**:
  - `src/lib/cron-auth.ts` — current auth check
  - AGENTS.md security lessons

  **Acceptance Criteria**:
  - [ ] 4+ edge case tests per route
  - [ ] Auth bypass attempts correctly rejected
  - [ ] Non-GET methods handled (405 or proper status)

  **QA Scenarios**:
  ```
  Scenario: Auth bypass via header manipulation
    Tool: Vitest
    Steps:
      1. Test: request with just 'valid-secret' (no Bearer prefix) → 401
      2. Test: request with extra whitespace → 401
      3. Test: request with case-different 'bearer' → 401
    Expected Result: All bypass attempts rejected
    Evidence: .sisyphus/evidence/sprint3-cron-tests/task-22-bypass.txt
  ```

  **Commit**: `test(cron): add edge case tests for auth and HTTP methods`
  - Files: `src/app/api/cron/*/route.test.ts` (additions)
  - Pre-commit: `pnpm test --changed`

- [ ] 23. **T6.3: Cron auth helper unit tests**

  **What to do**:
  - RED: Write `src/lib/cron-auth.test.ts`:
    - `verifyCronAuth` returns null for valid Bearer
    - Returns 401 Response for missing/invalid
    - Handles malformed Authorization header
  - GREEN: Tests pass
  - Commit as `test(cron): add unit tests for verifyCronAuth helper`

  **Must NOT do**:
  - ❌ Change `verifyCronAuth` signature
  - ❌ Add logging that leaks the secret

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T6.1

  **References**:
  - `src/lib/cron-auth.ts` — current implementation (359B)

  **Acceptance Criteria**:
  - [ ] `cron-auth.test.ts` has 5+ tests
  - [ ] Coverage for `cron-auth.ts` ≥90%

  **QA Scenarios**:
  ```
  Scenario: verifyCronAuth unit tests
    Tool: Vitest
    Steps:
      1. pnpm test cron-auth.test.ts
    Expected Result: 5+ tests pass
    Evidence: .sisyphus/evidence/sprint3-cron-tests/task-23-auth-helper.txt
  ```

  **Commit**: `test(cron): add unit tests for verifyCronAuth helper`
  - Files: `src/lib/cron-auth.test.ts` (new)
  - Pre-commit: `pnpm test cron-auth.test.ts`

#### Track 7: TimescaleDB Hypertable (3d) — `feat/sprint3-timescale` 🔴 **DEFERRED — needs Supabase Pro**

> **BLOCKER**: Supabase Pro plan required. Deferred until Pro access is available. Will be picked up in Sprint 4.

- [ ] 24. **T7.1: Verify Supabase TimescaleDB extension access**

  **What to do**:
  - Check `pnpm db:studio` or psql: `SELECT * FROM pg_available_extensions WHERE name = 'timescaledb';`
  - If available, document in evidence
  - If NOT available, STOP and notify user — defer to Sprint 4
  - Commit as `chore(db): verify TimescaleDB extension access on Supabase`

  **Must NOT do**:
  - ❌ Run migration without verifying extension access
  - ❌ Skip this step

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete first)
  - **Parallel Group**: Wave 2 (but blocks all of Track 7)
  - **Blocks**: T7.2, T7.3, T7.4
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] TimescaleDB extension `timescaledb` is available in `pg_available_extensions`
  - [ ] Evidence file documents the verification

  **QA Scenarios**:
  ```
  Scenario: TimescaleDB available
    Tool: Bash (psql)
    Steps:
      1. psql $DATABASE_URL -c "SELECT * FROM pg_available_extensions WHERE name = 'timescaledb';"
    Expected Result: shows timescaledb with available = true
    Evidence: .sisyphus/evidence/sprint3-timescale/task-24-extension.txt
  ```

  **Commit**: `chore(db): verify TimescaleDB extension access on Supabase`
  - Files: none (verification only) OR new file with confirmation
  - Pre-commit: none

- [ ] 25. **T7.2: Hand-written migration 0012 — create_hypertable for price_history**

  **What to do**:
  - Create `drizzle/0012_price_history_hypertable.sql`:
    - `CREATE EXTENSION IF NOT EXISTS timescaledb;`
    - `SELECT create_hypertable('price_history', 'recorded_at', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);`
  - Add to `drizzle/meta/_journal.json` with new entry
  - Verify migration applies cleanly: `pnpm db:push` or `psql -f drizzle/0012_price_history_hypertable.sql`
  - Verify hypertable exists: `SELECT * FROM _timescaledb_catalog.hypertable WHERE table_name = 'price_history';`
  - Commit as `chore(db): add TimescaleDB hypertable migration for price_history (ADR-009)`

  **Must NOT do**:
  - ❌ Use `drizzle-kit generate` (hand-written for explicit SQL)
  - ❌ Drop existing data
  - ❌ Add continuous aggregates yet (T7.4)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (DB migration is risky)
  - **Skills**: `git-master` (atomic, no destructive ops)

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete before T7.3)
  - **Parallel Group**: Wave 2
  - **Blocks**: T7.3, T7.4
  - **Blocked By**: T7.1, T1 (snapshot stubs)

  **References**:
  - `docs/adr/ADR-009-price-history-storage.md` — ADR with SQL example
  - `drizzle/0011_rate_limits.sql` — hand-written migration pattern
  - `src/db/schema/price_history.ts` — Drizzle schema (no hypertable call)

  **Acceptance Criteria**:
  - [ ] Migration file `0012_price_history_hypertable.sql` exists
  - [ ] `_journal.json` has entry idx=12
  - [ ] `psql -f drizzle/0012_price_history_hypertable.sql` succeeds
  - [ ] Hypertable visible in `_timescaledb_catalog.hypertable`

  **QA Scenarios**:
  ```
  Scenario: Migration applies cleanly
    Tool: Bash (psql)
    Steps:
      1. psql $DATABASE_URL -f drizzle/0012_price_history_hypertable.sql
      2. psql $DATABASE_URL -c "SELECT * FROM _timescaledb_catalog.hypertable WHERE table_name = 'price_history';"
    Expected Result: Migration succeeds, 1 hypertable row returned
    Evidence: .sisyphus/evidence/sprint3-timescale/task-25-migration.txt
  ```

  **Commit**: `chore(db): add TimescaleDB hypertable migration for price_history (ADR-009)`
  - Files: `drizzle/0012_price_history_hypertable.sql`, `drizzle/meta/_journal.json`
  - Pre-commit: `psql -f drizzle/0012_price_history_hypertable.sql` (dry-run on test DB)

- [ ] 26. **T7.3: Drizzle schema sync + index optimization for hypertable**

  **What to do**:
  - Update `src/db/schema/price_history.ts` if needed (Drizzle 0.45+ may not need explicit hypertable config in schema)
  - Add migration `0013_price_history_hypertable_indexes.sql` for performance:
    - Compression policy: `ALTER TABLE price_history SET (timescaledb.compress, timescaledb.compress_segmentby = 'game_id, store_id');`
    - `SELECT add_compression_policy('price_history', INTERVAL '30 days');`
    - `SELECT add_retention_policy('price_history', INTERVAL '2 years');`
  - Commit as `perf(db): add TimescaleDB compression + retention policies`

  **Must NOT do**:
  - ❌ Drop existing indexes
  - ❌ Disable compression
  - ❌ Change chunk_time_interval

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: T7.4
  - **Blocked By**: T7.2

  **References**:
  - `src/db/schema/price_history.ts` — current schema
  - ADR-009 §"Continuous Aggregates"

  **Acceptance Criteria**:
  - [ ] Migration `0013_price_history_hypertable_indexes.sql` applies cleanly
  - [ ] Compression policy: `SELECT * FROM timescaledb_information.compression_settings WHERE hypertable_name = 'price_history';` shows enabled
  - [ ] Retention policy: `SELECT * FROM timescaledb_information.jobs WHERE application_name LIKE '%Retention%';` shows entry

  **QA Scenarios**:
  ```
  Scenario: Compression + retention policies active
    Tool: Bash (psql)
    Steps:
      1. psql $DATABASE_URL -c "SELECT * FROM timescaledb_information.compression_settings WHERE hypertable_name = 'price_history';"
      2. psql $DATABASE_URL -c "SELECT * FROM timescaledb_information.jobs WHERE application_name LIKE '%Retention%';"
    Expected Result: Both policies visible
    Evidence: .sisyphus/evidence/sprint3-timescale/task-26-policies.txt
  ```

  **Commit**: `perf(db): add TimescaleDB compression + retention policies`
  - Files: `drizzle/0013_price_history_hypertable_indexes.sql`
  - Pre-commit: `psql -f drizzle/0013_price_history_hypertable_indexes.sql`

- [ ] 27. **T7.4: Price history query tests (time_bucket aggregation)**

  **What to do**:
  - RED: Write `src/actions/deals.test.ts` additions:
    - `getDailyPriceHistoryAction(gameId, 30)` returns array of `{ day, min_price }`
    - Query uses `time_bucket` for performance (verify via EXPLAIN)
  - GREEN: Tests pass
  - Add performance assertion: query completes in <500ms for 1 year of data
  - Commit as `test(deals): add price history aggregation tests for TimescaleDB`

  **Must NOT do**:
  - ❌ Skip the time_bucket call (raw SELECT will be slow)
  - ❌ Add migration that changes query results

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T7.3

  **References**:
  - `src/actions/deals.ts:285-295` — `getDailyPriceHistoryAction` (uses `get_daily_prices` RPC)
  - TimescaleDB time_bucket docs: https://docs.timescale.com/api/latest/hyperfunctions/time_bucket/

  **Acceptance Criteria**:
  - [ ] Test: 30-day price history returns 30 buckets
  - [ ] Test: query completes in <500ms (with 1 year of seeded data)
  - [ ] EXPLAIN ANALYZE shows time_bucket usage

  **QA Scenarios**:
  ```
  Scenario: Time bucket aggregation works
    Tool: Vitest
    Steps:
      1. Seed 1 year of price data (365 rows)
      2. Call getDailyPriceHistoryAction(gameId, 30)
      3. Assert returns 30 rows, each with min_price < max_price
      4. Measure time, assert <500ms
    Expected Result: Aggregation fast and correct
    Evidence: .sisyphus/evidence/sprint3-timescale/task-27-aggregation.txt
  ```

  **Commit**: `test(deals): add price history aggregation tests for TimescaleDB`
  - Files: `src/actions/deals.test.ts` (additions)
  - Pre-commit: `pnpm test deals.test.ts`

#### Track 8: Complexity Reductions — ✅ REMOVED (already done in PRs #13/#14)

> **Verification**: `grep -r "fallow-ignore-next-line complexity" src/` returns zero results.  
> All 10 complexity suppressors were removed in previous sprints. The `technical-debt.md` document was stale.  
> The 7 suppressors that remain are `unused-export` (different category — tracked separately).

#### P10 Fold-in: Alerts Dual-Storage Fix (2d) — `feat/sprint3-alerts-dedup`

> **Critical data-loss bug fix**: `PriceAlertModal.tsx` writes to Zustand BEFORE server. If tab closes in <1s, alert is in localStorage but not DB. Refactor to server-first (per P10 in technical-debt.md).

- [ ] 33. **P10.1: Refactor PriceAlertModal to server-first**

  **What to do**:
  - RED: Update test for `PriceAlertModal` to verify server action is called BEFORE local state update
  - GREEN: In `src/components/PriceAlertModal.tsx:43-67`:
    - Call `createPriceAlertAction(gameID, targetPrice)` FIRST
    - Only on success, update Zustand
    - On error, show error, do NOT update local state
  - Remove `setAlertId` workaround (no longer needed since server returns ID directly)
  - Verify `useAlertsSync` in `SyncManager.tsx` can be removed (no more dual-storage)
  - Commit sequence: `test(modal): update test for server-first alert creation` → `refactor(modal): make server action the source of truth` → `chore(sync): remove redundant useAlertsSync`

  **Must NOT do**:
  - ❌ Lose the "no data loss" guarantee
  - ❌ Block UI on server action (keep async)

  **Recommended Agent Profile**:
  - **Category**: `deep` (refactor of critical user flow)
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: NO (after T4 + T5)
  - **Parallel Group**: Wave 2
  - **Blocks**: P10.2
  - **Blocked By**: T4 (AlertCard), T5 (alertStore tests)

  **References**:
  - `src/components/PriceAlertModal.tsx:43-94` — current handleSave/handleRemove
  - `src/hooks/useSyncHooks.ts:64-99` — useAlertsSync (to remove)
  - `src/store/alertStore.ts:1-45` — store (keep for offline read)
  - Technical-debt.md P10 — bug description

  **Acceptance Criteria**:
  - [ ] Server action called BEFORE local state update
  - [ ] Error → local state unchanged, user sees error
  - [ ] Success → local state updated with server-returned ID
  - [ ] `useAlertsSync` removed from SyncManager (or no-op)
  - [ ] E2E test (T5.2) still passes

  **QA Scenarios**:
  ```
  Scenario: Server-first alert creation
    Tool: Vitest (jsdom)
    Preconditions: Mock createPriceAlertAction to throw
    Steps:
      1. Render PriceAlertModal
      2. Click Save
      3. Assert addAlert NOT called (server failed first)
      4. Assert error message visible
    Expected Result: No local state update on server failure
    Evidence: .sisyphus/evidence/sprint3-alerts-dedup/task-33-server-first.txt
  ```

  **Commit**: 3 atomic commits
  - Files: `src/components/PriceAlertModal.tsx`, `src/components/PriceAlertModal.test.tsx`, `src/components/SyncManager.tsx`
  - Pre-commit: `pnpm test --changed`

- [ ] 34. **P10.2: Update TanStack Query for alerts (server is source of truth)**

  **What to do**:
  - RED: Test that `useUserAlerts` hook returns server data, not local state
  - GREEN: Create `src/hooks/useUserAlerts.ts` (TanStack Query wrapper around `getUserAlertsAction`)
  - Update `src/app/alerts/page.tsx` to use `useUserAlerts` instead of `useAlerts`
  - Update `src/components/PriceAlertBadge.tsx` to use `useUserAlerts` for `hasAlert` check
  - Commit sequence: `test(hooks): add useUserAlerts hook test` → `feat(hooks): add useUserAlerts TanStack Query hook` → `refactor(alerts): use useUserAlerts in AlertsPage and PriceAlertBadge`

  **Must NOT do**:
  - ❌ Remove `useAlerts` store (keep for offline reads if needed)
  - ❌ Break PriceAlertModal (still uses store for current price input)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: P10.1

  **References**:
  - `src/app/alerts/page.tsx:60-72` — current useQuery
  - `src/components/PriceAlertBadge.tsx:760B` — current badge
  - TanStack Query patterns: `src/hooks/useWishlistGames.ts:728B`

  **Acceptance Criteria**:
  - [ ] useUserAlerts returns server data
  - [ ] AlertsPage uses new hook
  - [ ] PriceAlertBadge uses new hook for hasAlert
  - [ ] No regression: alerts CRUD E2E test passes

  **QA Scenarios**:
  ```
  Scenario: useUserAlerts fetches from server
    Tool: Vitest (jsdom)
    Steps:
      1. Mock getUserAlertsAction to return 2 alerts
      2. Render hook
      3. Assert data has 2 alerts
    Expected Result: Server data returned, not localStorage
    Evidence: .sisyphus/evidence/sprint3-alerts-dedup/task-34-hook.txt
  ```

  **Commit**: 3 atomic commits
  - Files: `src/hooks/useUserAlerts.ts`, `src/hooks/useUserAlerts.test.tsx`, `src/app/alerts/page.tsx`, `src/components/PriceAlertBadge.tsx`
  - Pre-commit: `pnpm test --changed`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

### Wave 3 — Integration & Cross-Track Verification (After Wave 2)

- [ ] 35. **T-INT1: Merge all 12 feature branches sequentially**

  **What to do**:
  - Order: P7 snapshot stubs → P12 AlertCard → T5 auth fixture → T5 alerts CRUD E2E → P10.1 server-first → P10.2 useUserAlerts → T1 PWA → T2 theme → T3 store filter → T4 analytics → T6 cron tests → T4 deals upsert
  - ⚠️ Navbar merge strategy: T1 (InstallPWAButton), T2 (ThemeToggle), and T3 (StoreFilter) all modify `Navbar.tsx`. Merge them in this order: T1 → T2 → T3. This way, each subsequent merge handles the accumulated changes. After T3 merges, run `pnpm dev` once to verify Navbar renders all three additions.
  - Resolve any cross-track conflicts (likely also: layout.tsx, package.json)
  - Each merge: `git checkout main && git merge --no-ff feat/sprint3-{branch}`
  - Run `pnpm check` after each merge
  - Document any merge order adjustments in evidence

  **Must NOT do**:
  - ❌ Use rebase to flatten history
  - ❌ Skip pnpm check between merges
  - ❌ Force-push

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (orchestration)
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential merge)
  - **Parallel Group**: Wave 3
  - **Blocks**: T-INT2, T-INT3, T-INT4, T-INT5
  - **Blocked By**: All 12 feature branches complete

  **Acceptance Criteria**:
  - [ ] All 12 branches merged to main via PR
  - [ ] `pnpm check` passes after each merge
  - [ ] No merge conflicts unresolved
  - [ ] Git log shows 12 merge commits

  **QA Scenarios**:
  ```
  Scenario: All branches merged cleanly
    Tool: Bash
    Steps:
      1. git log main --oneline -20
      2. pnpm check
    Expected Result: 12 merge commits, all checks pass
    Evidence: .sisyphus/evidence/sprint3-integration/task-35-merge-log.txt
  ```

  **Commit**: 12 PR merge commits (one per branch)
  - Files: full codebase
  - Pre-commit: `pnpm check`

- [ ] 36. **T-INT2: Coverage delta verification (must hit Phase 2 targets)**

  **What to do**:
  - Run `pnpm test:coverage` and capture full report
  - Verify: lines ≥38%, functions ≥36%, branches ≥33%, statements ≥38%
  - If any threshold fails, document which track needs more tests
  - Generate coverage badge markdown for `README.md`
  - Commit evidence (not source) as `chore(coverage): generate Sprint 3 coverage report`

  **Must NOT do**:
  - ❌ Lower thresholds to pass
  - ❌ Exclude files to artificially boost coverage

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T-INT3, T-INT4, T-INT5)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F2
  - **Blocked By**: T-INT1

  **Acceptance Criteria**:
  - [ ] `pnpm test:coverage` exits 0
  - [ ] All 4 thresholds met (lines 38%, functions 36%, branches 33%, statements 38%)
  - [ ] Coverage delta vs Sprint 2: lines +17%, functions +19%, branches +17%, statements +18%

  **QA Scenarios**:
  ```
  Scenario: Coverage ramp verified
    Tool: Bash
    Steps:
      1. pnpm test:coverage 2>&1 | tee coverage.txt
      2. grep -E "(All files|Statements|Branches|Functions|Lines)" coverage.txt
    Expected Result: All thresholds ≥ target
    Evidence: .sisyphus/evidence/sprint3-integration/task-36-coverage.txt
  ```

  **Commit**: `chore(coverage): generate Sprint 3 coverage report` (evidence only)
  - Files: `.sisyphus/evidence/sprint3-integration/coverage.txt`
  - Pre-commit: `pnpm test:coverage`

- [ ] 37. **T-INT3: Lighthouse PWA audit (must be ≥80)**

  **What to do**:
  - Run `pnpm build && pnpm start` (production)
  - Run `npx lhci autorun --collect.staticDistDir=.next --assert.assertions.categories:pwa=[80,100]`
  - Save full Lighthouse report to evidence
  - If score <80, document which audit failed and add remediation tasks
  - Commit as `docs(pwa): capture Sprint 3 Lighthouse PWA score`

  **Must NOT do**:
  - ❌ Run dev server (use production build only)
  - ❌ Skip if score <80 (must fix or document why)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T-INT2, T-INT4, T-INT5)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F3
  - **Blocked By**: T-INT1, Track 1 (PWA)

  **Acceptance Criteria**:
  - [ ] Lighthouse PWA score ≥80
  - [ ] Report saved to `.sisyphus/evidence/sprint3-integration/lighthouse.json`
  - [ ] No critical PWA audits failing

  **QA Scenarios**:
  ```
  Scenario: Lighthouse PWA passes
    Tool: Lighthouse CLI
    Steps:
      1. pnpm build && pnpm start &
      2. sleep 5
      3. npx lhci autorun --collect.staticDistDir=.next --assert.assertions.categories:pwa=[80,100]
      4. kill %1
    Expected Result: Score ≥80
    Evidence: .sisyphus/evidence/sprint3-integration/task-37-lighthouse.json
  ```

  **Commit**: `docs(pwa): capture Sprint 3 Lighthouse PWA score` (evidence)
  - Files: `.sisyphus/evidence/sprint3-integration/lighthouse.json`
  - Pre-commit: `pnpm build`

- [ ] 38. **T-INT4: Sentry verify (no new console.error in prod)**

  **What to do**:
  - `grep -rn "console.error" src/ --include="*.ts" --include="*.tsx" | grep -v "// allow-console"`
  - Verify all new code uses `Sentry.captureException()` instead of `console.error()`
  - Document exceptions with `// allow-console: <reason>` comments where console is intentional (e.g., dev warnings)
  - Commit as `chore(monitoring): verify no new console.error in production code`

  **Must NOT do**:
  - ❌ Add new `console.error` without Sentry capture
  - ❌ Suppress with `// eslint-disable` (use Sentry instead)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F2
  - **Blocked By**: T-INT1

  **Acceptance Criteria**:
  - [ ] Zero NEW `console.error` in Sprint 3 code (compare to Sprint 2 baseline)
  - [ ] All new error paths use Sentry

  **QA Scenarios**:
  ```
  Scenario: No new console.error
    Tool: Bash
    Steps:
      1. git log main --since="2026-06-19" --name-only --pretty=format: | grep -E "\.tsx?$" | sort -u > sprint3_files.txt
      2. cat sprint3_files.txt | xargs grep -n "console.error" 2>/dev/null
    Expected Result: Zero hits (or only intentional + comment)
    Evidence: .sisyphus/evidence/sprint3-integration/task-38-sentry-verify.txt
  ```

  **Commit**: `chore(monitoring): verify no new console.error in production code`
  - Files: evidence only
  - Pre-commit: `grep -rn "console.error" src/`

- [ ] 39. **T-INT5: Final smoke test (all features working together)**

  **What to do**:
  - Run a full Playwright E2E suite covering cross-track integration:
    1. Visit home, toggle theme, see PWA install prompt
    2. Navigate to /search, filter by 5 stores, see results
    3. Click affiliate link, verify analytics event
    4. Sign in, set alert, see in /alerts, delete
    5. Check service worker caches assets
  - Save screenshot evidence per step
  - Document any cross-track bugs in `.sisyphus/evidence/sprint3-integration/smoke-test.md`
  - Commit as `test(e2e): add Sprint 3 cross-track smoke test`

  **Must NOT do**:
  - ❌ Skip integration testing (each track's tests don't catch cross-track bugs)
  - ❌ Run dev server (use production build)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` (cross-track test)
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F3
  - **Blocked By**: T-INT1

  **Acceptance Criteria**:
  - [ ] All 5 cross-track flows pass
  - [ ] No cross-track regressions
  - [ ] Evidence captured per flow

  **QA Scenarios**:
  ```
  Scenario: Full cross-track smoke test
    Tool: Playwright
    Preconditions: Production build, seeded test data
    Steps:
      1. Run pnpm test:e2e --grep "Sprint 3 smoke"
    Expected Result: 5+ flows pass
    Evidence: .sisyphus/evidence/sprint3-integration/task-39-smoke.png
  ```

  **Commit**: `test(e2e): add Sprint 3 cross-track smoke test`
  - Files: `tests/e2e/sprint3-smoke.spec.ts`
  - Pre-commit: `pnpm test:e2e --grep "Sprint 3 smoke"`

---

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/sprint3-*`. Compare 12 deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Branches [N/12] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `./node_modules/.bin/tsc --noEmit` + `./node_modules/.bin/biome check .` + `pnpm test:coverage`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify coverage delta hit 42% lines / 38% functions / 35% branches.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Coverage [lines: N% / func: N% / branch: N%] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY track — follow exact steps, capture evidence. Test cross-track integration: theme toggle + analytics event + PWA install + store filter all working together. Test edge cases: theme switch with offline PWA, alert create with no network, store filter with 50+ stores. Save to `.sisyphus/evidence/sprint3-final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each of 12 branches: read PR diff. Verify 1:1 — every "Must Have" was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT Have" compliance (no Vercel Analytics, no next-pwa, no custom theme provider). Detect cross-task contamination: Track 1 touching Track 2's files. Flag unaccounted changes.
  Output: `Branches [N/12 compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

### Atomic Commit Convention (Strict TDD)
Every commit message follows `type(scope): description`:

| Type | TDD Phase | Example |
|------|-----------|---------|
| `test` | RED | `test(pwa): add failing test for offline cache registration` |
| `feat` | GREEN | `feat(pwa): register service worker via Serwist` |
| `refactor` | REFACTOR | `refactor(pwa): extract manifest config to constant` |
| `fix` | GREEN | `fix(pwa): handle manifest MIME type for Safari` |
| `chore` | Setup | `chore(deps): install serwist, next-themes, posthog-js` |
| `docs` | Docs | `docs(adr): add ADR-013 for PWA service worker` |

### Commit Counts Per Track

| Track | Expected Commits |
|-------|------------------|
| T1 snapshot stubs | 1 chore |
| T2 coverage threshold | 1 chore |
| T3 P4 deals upsert | 3 (test + feat + refactor) |
| T4 P12 AlertsPage | 6 (3 components × test+feat, + refactor) |
| T5 alertStore scaffold | 1 test |
| T6 deps install | 1 chore |
| Track 1 PWA | 8-10 (config + 3 cache strategies + install + Lighthouse) |
| Track 2 Theme | 6-8 (provider + 3 components + tests) |
| Track 3 Store filter | 5-7 (combobox + search + multi-select + cap removal) |
| Track 4 Analytics | 7-9 (init + 3 event hooks + page view + click + alert) |
| Track 5 Alerts E2E | 3-4 (auth fixture + spec + refactor) |
| Track 6 Cron tests | 8-10 (expansion tests for 3 routes) |
| Track 7 TimescaleDB | 4-5 (snapshot + migration + schema sync + tests) |
| Track 8 | ✅ REMOVED |
| P10 alerts dual-storage | 4-5 (refactor + tests + e2e) |
| **TOTAL** | **~60-70 atomic commits** |

### Pre-Push Gate (every push)
```bash
pnpm lint && ./node_modules/.bin/tsc --noEmit && pnpm test:coverage && pnpm build
```

### Pre-Push Skip Rule
Only use `git push --no-verify` if **pre-existing** fallow findings block the push. Never skip for new code.

---

## Success Criteria

### Verification Commands
```bash
# Coverage must hit Phase 2 targets
pnpm test:coverage
# Expected: lines ≥38%, functions ≥36%, branches ≥33%, statements ≥38%

# All 12 PRs merged
gh pr list --state merged --base main --json number,title | jq 'length'  # Expected: ≥12

# Lighthouse PWA ≥80
npx lhci autorun --collect.staticDistDir=.next --assert.preset=lighthouse:recommended --assert.assertions.categories:pwa=[80,100]

# No fallow CRITICAL
pnpm fallow:audit  # Expected: CRITICAL=0, suppressors ≤3

# Knip clean
pnpm knip --no-exit-code  # Expected: 0 unused exports/types

# Build + type check clean
./node_modules/.bin/tsc --noEmit && pnpm build  # Expected: exit 0

# Biome clean
./node_modules/.bin/biome check .  # Expected: 0 errors, 0 warnings

# Sentry verify (no console.error in new code)
grep -rn "console.error" src/ --include="*.ts" --include="*.tsx" | grep -v "// allow-console"  # Expected: only pre-existing sites
```

### Final Checklist
- [ ] All 8 P2 items shipped (PWA, Theme, Store filter, Analytics, Alerts E2E, Cron tests, Timescale, Complexity)
- [ ] All 4 tech-debt items closed (P4, P7, P10, P12)
- [ ] 12 atomic PRs merged to main
- [ ] Coverage ≥ 42% lines, 38% functions, 35% branches
- [ ] Lighthouse PWA ≥ 80
- [ ] Fallow suppressors: 10 → ≤3
- [ ] No new console.error in production code
- [ ] No new `as any` / `@ts-ignore`
- [ ] F1-F4 all APPROVE
- [ ] User explicit "okay" received
