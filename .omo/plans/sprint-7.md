# Sprint 7 — Coverage Push + Dead Code Cleanup + Quality

## TL;DR

> **Quick Summary**: Push coverage from 60.07% → 65% lines by testing untested server actions and components, clean dead code, and improve quality via Fallow duplication fixes.
>
> **Deliverables**:
> - 6-8 new test files + 2 existing test file extensions
> - ~95+ lines of new coverage (gap = 81 lines)
> - Dead code removed (if any found via knip pass)
> - 3 Fallow duplication groups resolved
> - All gates pass: biome, tsc, test, coverage
>
> **Estimated Effort**: 4-6 hours
> **Parallel Execution**: YES — 3 parallel tracks (see below)
> **Critical Path**: Track A (server actions) → Track B (components) → Track C (cleanup) → Gate

---

## Context

### Current State (from coverage run)
| Metric | Value | Target |
|--------|-------|--------|
| Lines | 60.07% (990/1648) | **65%** (1071/1648) |
| Branches | 50.55% (549/1086) | ≥55% |
| Functions | 52.47% (297/566) | ≥55% |
| Statements | 60.63% (1126/1857) | ≥65% |
| Tests | 583 passed | ~630+ |

### Coverage Gap Math
- 1648 total source lines (vitest excludes `src/db/**`, `src/data/**`, `src/scripts/**`)
- 990 currently covered
- 65% target = 1071 lines
- **Gap = 81 lines to cover**

### Dead Code Investigation (IMPORTANT)
`useAlertsSync` and `useCloudToLocalSync` **do not exist** in the codebase. Grep found 0 matches.
- `useWishlistSync` exists in `src/hooks/useSyncHooks.ts` and IS consumed by `SyncManager.tsx`
- Run `pnpm knip` to find actual dead code — current knip output shows only package version warnings
- Fallow reports 0 dead code, only 3 duplication groups

### Key Files (sorted by missing coverage lines)
| File | Missing | Total | % Covered | Type |
|------|---------|-------|-----------|------|
| `src/actions/deals.ts` | 56 | 102 | 45.1% | Server action |
| `src/app/out/OutRedirector.tsx` | 34 | 34 | 0% | Server component |
| `src/components/NotificationBell.tsx` | 31 | 31 | 0% | Client component |
| `src/components/AddToListModal.tsx` | 29 | 29 | 0% | Client component |
| `src/components/FilterSidebar.tsx` | 22 | 34 | 35.3% | Client component |
| `src/actions/search.ts` | 21 | 39 | 46.1% | Server action |
| `src/components/HistoricalLows.tsx` | 21 | 21 | 0% | Server component |
| `src/components/FlashSales.tsx` | 17 | 17 | 0% | Server component |
| `src/components/SidebarModal.tsx` | 16 | 16 | 0% | Client component |
| `src/components/DealRow.tsx` | 16 | 16 | 0% | Server component |
| `src/components/CookieBanner.tsx` | 13 | 13 | 0% | Client component |
| `src/components/GameCard.tsx` | 13 | 13 | 0% | Server component |
| `src/components/DealsBadge.tsx` | 9 | 9 | 0% | Pure presentational |
| `src/utils/supabase/server.ts` | 10 | 10 | 0% | Utility |

### Vitest Thresholds (current → target)
```ts
thresholds: {
  lines: 44 → 55,      // raise after this sprint
  functions: 40 → 48,
  branches: 36 → 42,
  statements: 44 → 55,
}
```

---

## Work Objectives

### Core Objective
Raise coverage from 60.07% → 65% lines, 50.55% → 55% branches, by adding tests to untested server actions and simple components, and fixing Fallow duplication.

### Definition of Done
- [ ] `pnpm test -- --run` passes (583 + new tests, ~630+ total)
- [ ] `pnpm test:coverage` shows ≥65% lines, ≥55% branches
- [ ] `biome check .` passes
- [ ] `tsc --noEmit` passes
- [ ] `pnpm knip` — 0 dead exports (or documented exceptions)
- [ ] `pnpm fallow:audit` — 0 duplication groups
- [ ] 1 commit per file, conventional commit format
- [ ] PR created and pushed

### Test Pattern
1. Read source, enumerate 3-5 edge cases per function
2. Write `*.test.ts` with `describe` per function
3. Mock only what's needed (use patterns from Sprint 6)
4. Target 100% branch per file

### Must Have
- Test each function/path in target files
- Mock external dependencies (fetch, env, supabase, db)
- 100% branch coverage on each new test file

### Must NOT Have
- test.skip() or test.todo()
- More than 1 commit per file
- Testing page components that need full RSC render (OutRedirector, HistoricalLows, etc.) — these need E2E
- Modifying production source code unless removing confirmed dead code

---

## Execution Strategy

### 3 Parallel Tracks

```
Track A: Server Actions (highest coverage gain, ~77 lines)
├── Task A1: src/actions/deals.ts — extend test coverage (+56 lines max)
├── Task A2: src/actions/search.ts — test syncGamesToTypesenseAction (+21 lines)
└── Task A3: src/utils/supabase/server.ts — test createClient (+10 lines)

Track B: Components (simple presentational, ~55 lines)
├── Task B1: src/components/DealsBadge.tsx — pure presentational (+9 lines)
├── Task B2: src/components/CookieBanner.tsx — client with localStorage (+13 lines)
├── Task B3: src/components/FilterSidebar.tsx — extend existing partial (+22 lines)
└── Task B4: src/components/SidebarModal.tsx — simple client (+16 lines)

Track C: Quality Cleanup
├── Task C1: Fallow duplication — extract shared test helpers
├── Task C2: Vitest threshold bump (after coverage confirmed)
└── Task C3: Knip pass — verify no dead exports
```

### Coverage Projection

| Track | Target Files | Max New Lines | Confidence |
|-------|-------------|---------------|------------|
| A: Server Actions | deals.ts, search.ts, server.ts | 77 | High (pure functions + mocked DB) |
| B: Components | DealsBadge, CookieBanner, FilterSidebar, SidebarModal | 60 | Medium (need jsdom + mocking) |
| C: Cleanup | — | 0 (denominator reduction if dead code removed) | — |
| **Total** | **7 files** | **~137** | |

- Conservative estimate: 81 new lines → **65.0%** lines
- Optimistic estimate: 100+ new lines → **66%+** lines

---

## TODOs

### Track A: Server Actions (start here — biggest bang)

- [ ] A1. **test(actions): deals.ts extend** — ~15 tests, cover untested helpers and actions

  **File**: `src/actions/deals.ts` (56 missing lines, 45.1% covered)
  **Existing test**: `src/actions/deals.test.ts` (249 lines, covers resolve* + ingest + price history)
  **What's NOT tested** (lines 17-136):
  - `validateSortBy(input)` — lines 21-24 (4 lines): default, valid sort, invalid sort
  - `validatePageSize(input)` — lines 26-31 (6 lines): default, valid, NaN, clamp min, clamp max
  - `isValidPrice(input)` — lines 33-35 (3 lines): undefined, valid, NaN
  - `isValidStoreId(input)` — lines 37-39 (3 lines): undefined, valid 1-3 digits, invalid
  - `sanitizeTitle(input)` — lines 41-44 (4 lines): undefined, too long (>200), valid
  - `buildDealsUrl(params)` — lines 46-64 (19 lines): with/without optional params
  - `sanitizeDealParams(params)` — lines 68-86 (19 lines): full param processing
  - `getDealsAction(params)` — lines 92-104 (13 lines): calls fetchDealsWithFallback
  - `getStoresAction()` — lines 107-128 (22 lines): fetch + hardcoded stores
  - `getGameAction(id)` — lines 134-136 (3 lines): delegates to fetchGameDetails
  - `getDealsFromDBAction(limit)` — lines 313-331 (19 lines): DB query

  **Pattern**: vi.hoisted + vi.mock for `@/db`, `@/services/fetch-helpers`, `@/services/ingest`
  **Strategy**: Add tests to existing `deals.test.ts` for the pure helpers. Test exported actions via mock chains.

  **Edge cases**:
  1. validateSortBy: undefined → 'Deal Rating', valid → passthrough, invalid → 'Deal Rating'
  2. validatePageSize: undefined → 20, 'abc' → 20, '0' → 1 (clamped), '200' → 100 (clamped)
  3. isValidPrice: undefined → false, '9.99' → true, 'abc' → false
  4. isValidStoreId: undefined → false, '1' → true, '123' → true, '1234' → false
  5. sanitizeTitle: undefined → undefined, long string → undefined, valid → passthrough
  6. buildDealsUrl: all params populated, optional params omitted
  7. getDealsAction: delegates to fetchDealsWithFallback with sanitized URL
  8. getStoresAction: fetch success, fetch error, hardcoded stores always present
  9. getGameAction: delegates to fetchGameDetails
  10. getDealsFromDBAction: mock db.select chain, default limit=20, custom limit

  **Acceptance**:
  - `pnpm test src/actions/deals.test.ts` → PASS
  - Coverage on `deals.ts` → 90%+ (from 45.1%)

- [ ] A2. **test(actions): search.ts sync** — ~6 tests, cover syncGamesToTypesenseAction

  **File**: `src/actions/search.ts` (21 missing lines, 46.1% covered)
  **Existing test**: `src/actions/search.test.ts` (118 lines, covers searchGamesAction)
  **What's NOT tested** (lines 59-105):
  - `fetchDealsForSync()` — lines 59-75 (internal): fetch CheapShark deals
  - `syncGamesToTypesenseAction()` — lines 81-105: no key, empty deals, success, error

  **Pattern**: vi.hoisted + vi.mock for `@/lib/typesense`, vi.stubGlobal fetch
  **Strategy**: Add tests to existing `search.test.ts`

  **Edge cases**:
  1. syncGamesToTypesenseAction: no TYPESENSE_ADMIN_KEY → returns error
  2. syncGamesToTypesenseAction: fetch returns empty → 'No deals fetched'
  3. syncGamesToTypesenseAction: fetch returns deals → maps + indexes → success
  4. syncGamesToTypesenseAction: indexGamesBatch returns false → success=false
  5. syncGamesToTypesenseAction: throws → returns error
  6. fetchDealsForSync: fetch timeout (abort) → returns []

  **Acceptance**:
  - `pnpm test src/actions/search.test.ts` → PASS
  - Coverage on `search.ts` → 90%+ (from 46.1%)

- [ ] A3. **test(utils): supabase/server** — 4 tests, 100% branch

  **File**: `src/utils/supabase/server.ts` (10 missing lines, 0% covered)
  **New test file**: `src/utils/supabase/server.test.ts`
  **Pattern**: vi.mock for `@supabase/ssr`, `next/headers`, env var setup

  **Edge cases**:
  1. happy path → returns server client
  2. missing URL env → throws
  3. missing key env → throws
  4. setAll callback: cookie set success
  5. setAll callback: cookie set throws → console.error (soft fail)

  **Acceptance**:
  - `pnpm test src/utils/supabase/server.test.ts` → PASS
  - Coverage → 100%

### Track B: Components (parallel with Track A)

- [ ] B1. **test(components): DealsBadge** — 5 tests, 100% branch

  **File**: `src/components/DealsBadge.tsx` (9 missing lines, 0% covered)
  **New test file**: `src/components/DealsBadge.test.tsx`
  **Pattern**: jsdom + render + screen queries (no mocking needed — pure presentational)
  **Note**: File uses CSS modules (`*.module.css`) — need `vi.mock('*.module.css', ...)`

  **Edge cases**:
  1. type='HL' → renders "HL" span
  2. type='EPIC' compact=false → renders "🔥 EPIC"
  3. type='EPIC' compact=true → renders "🔥" only
  4. type='FREE' → renders "FREE"
  5. type='RATING' with value → renders "★ {value}%"
  6. type='RATING' without value → renders null
  7. unknown type → renders null

  **Acceptance**:
  - `pnpm test src/components/DealsBadge.test.tsx` → PASS
  - Coverage → 100%

- [ ] B2. **test(components): CookieBanner** — 5 tests, 100% branch

  **File**: `src/components/CookieBanner.tsx` (13 missing lines, 0% covered)
  **New test file**: `src/components/CookieBanner.test.tsx`
  **Pattern**: jsdom + render + fireEvent + localStorage mock

  **Edge cases**:
  1. no localStorage consent → banner visible
  2. localStorage has 'accepted' → banner hidden
  3. localStorage has 'rejected' → banner hidden
  4. click "Aceitar" → sets 'accepted', hides banner
  5. click "Rejeitar" → sets 'rejected', hides banner

  **Acceptance**:
  - `pnpm test src/components/CookieBanner.test.tsx` → PASS
  - Coverage → 100%

- [ ] B3. **test(components): FilterSidebar extend** — ~8 tests, push to 100% branch

  **File**: `src/components/FilterSidebar.tsx` (22 missing lines, 35.3% covered)
  **Existing test**: `tests/unit/components/StoreFilter.test.tsx` (tests StoreFilter only, not FilterSidebar)
  **New test file**: `src/components/FilterSidebar.test.tsx`
  **Pattern**: jsdom + vi.mock for `next/navigation` (useRouter, useSearchParams)

  **Edge cases**:
  1. renders with stores
  2. handleStoreToggle: add store to set
  3. handleStoreToggle: remove store from set
  4. handleSelectAll: selects all stores
  5. handleClearAll: clears all stores
  6. applyFilters: pushes URL with params
  7. clearFilters: resets state, pushes clean URL
  8. price input changes state

  **Acceptance**:
  - `pnpm test src/components/FilterSidebar.test.tsx` → PASS
  - Coverage → 90%+

- [ ] B4. **test(components): SidebarModal** — 4 tests, 100% branch

  **File**: `src/components/SidebarModal.tsx` (16 missing lines, 0% covered)
  **New test file**: `src/components/SidebarModal.test.tsx`
  **Pattern**: jsdom + render + fireEvent

  **Edge cases**:
  1. isOpen=false → renders nothing
  2. isOpen=true → renders children
  3. click overlay → onClose called
  4. click close button → onClose called
  5. Escape key → onClose called

  **Acceptance**:
  - `pnpm test src/components/SidebarModal.test.tsx` → PASS
  - Coverage → 100%

### Track C: Quality Cleanup

- [ ] C1. **fix(fallow)** — extract shared test helper to eliminate 3 duplication groups

  **Current Fallow output**: 3 clone groups (54 lines across 3 files)
  - `fetch-helpers.test.ts:123-135` ↔ `game-enrichment.test.ts:42-54` (13 lines, mock fetch setup)
  - `useClickOutside.test.ts:8-17` ↔ `useClickOutside.test.ts:49-58` (10 lines, same file)
  - `useClickOutside.test.ts:33-40` ↔ `useClickOutside.test.ts:51-58` (8 lines, same file)

  **Action**:
  1. Extract `createMockFetch()` helper into `tests/setup.ts` or a new `tests/helpers/fetch-mock.ts`
  2. Refactor `useClickOutside.test.ts` to extract shared render+click pattern
  3. Run `pnpm fallow:audit` → 0 groups

  **Acceptance**:
  - `pnpm fallow:audit` → 0 duplication groups
  - `pnpm test -- --run` → ALL pass (no regressions)

- [ ] C2. **chore(vitest)** — raise coverage thresholds after Track A+B confirmed

  **When**: After coverage check confirms ≥65% lines
  **Changes** in `vitest.config.ts`:
  ```ts
  thresholds: {
    lines: 55,       // was 44
    functions: 48,   // was 40
    branches: 42,    // was 36
    statements: 55,  // was 44
  }
  ```

  **Acceptance**:
  - `pnpm test:coverage -- --run` → passes with new thresholds

- [ ] C3. **chore(knip)** — verify 0 dead exports, document any exceptions

  **Action**:
  1. Run `pnpm knip` and review output
  2. Current knip shows 3 package warnings (testing-library/user-event, esbuild, serwist) — these are false positives
  3. Check for any unused exports — `fallow-ignore-next-line unused-export` comments on deals.ts suggest known unused exports

  **Acceptance**:
  - `pnpm knip` → 0 real dead code issues
  - Document any `fallow-ignore` exceptions if they're intentional

---

## Verification Strategy

### Self-Gate (before push, ~60s)
```bash
./node_modules/.bin/biome check .          # → 0 errors
./node_modules/.bin/tsc --noEmit            # → 0 errors
pnpm test -- --run                          # → ALL pass
pnpm test:coverage                          # → ≥65% lines, ≥55% branches
pnpm knip                                   # → 0 dead code
pnpm fallow:audit                           # → 0 duplication groups
```

### Evidence per file
- Commit message: `test(scope): add N tests for X (100% branch)`
- Branch coverage per file confirmed in `pnpm test:coverage` output
- Fallow clean output as proof of duplication fix

---

## Commit Strategy

- 1 commit per file: `test(scope): add N tests for X (100% branch)`
- Order: Track A (actions) → Track B (components) → Track C (cleanup) → Gate → PR
- Each commit: file changes + run gate locally

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| deals.ts helpers are private (not exported) | Can't test directly | Test through exported getDealsAction which calls them |
| CSS modules in component tests | import error | vi.mock('*.module.css', () => ({})) pattern |
| FilterSidebar depends on StoreFilter + next/navigation | Complex mocking | Mock both, test state logic |
| Coverage math might not hit 65% if some tests only partially cover | Shortfall | Track B has 60+ lines buffer above 81 needed |
| `useAlertsSync`/`useCloudToLocalSync` don't exist | Dead code task N/A | Run knip instead, note discrepancy to lead |

---

## Success Criteria

- [ ] Coverage: ≥65% lines, ≥55% branches
- [ ] Tests: 583 + ~50 new = ~633+ total
- [ ] Fallow: 0 duplication groups
- [ ] Knip: 0 dead code
- [ ] Biome + tsc: 0 errors
- [ ] PR created for review
