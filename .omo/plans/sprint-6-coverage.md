# Sprint 6 — Test Coverage Push (v1.1 — audited)

## TL;DR

> **Quick Summary**: Add unit tests to small 0% coverage files in `src/services/`, `src/lib/`, `src/utils/supabase/`, and `src/hooks/`. Realistic target: 50.7% → **~55% lines**, 42.1% → ~47% branches.
>
> **Deliverables**:
> - 14 new test files (services, supabase, lib, hooks)
> - 506 → ~600 tests (+94)
> - All gates pass: biome, tsc, test, coverage
>
> **Estimated Effort**: 6-8 hours (honest, post-audit)
> **Parallel Execution**: NO — sequential, single dev
> **Critical Path**: Wave 0 (trivials) → Wave 1 (services) → Wave 2 (supabase) → Wave 3 (hooks) → Wave 4 (gate)

---

## Context

### Current State
- **Coverage**: 50.71% lines / 42.08% branches (506 tests, 9183 source lines)
- **Methodology experiment concluded**: Back to the simple flow (no SPEC/REVIEW agents)
- **Test pattern from Sprint 5**: `describe` per function, edge cases explicit, 100% branch per file target

### Coverage Math (honest)
- 9183 total source lines
- 50.71% covered = 4656 lines
- 55% target = 5050 lines → **+394 lines to cover**
- Plan scope: ~373 lines (10 target files + 4 trivial extras) → **54.7% lines**
- Plus partial-coverage pushes → **55%+ lines** achievable

### Audit Findings (addressed in v1.1)
1. ✅ Fixed: `deal-enrichment.ts` → `game-enrichment.ts` (real file)
2. ✅ Fixed: Out-of-scope contradiction — 3 hooks moved to in-scope
3. ✅ Fixed: Line counts corrected to actual `wc -l`
4. ✅ Fixed: Difficulty reclassified (social=Hard, middleware=Medium-Hard, etc.)
5. ✅ Fixed: Mocking prerequisites documented

---

## Mocking Prerequisites (from existing tests)

These patterns are required for the tests in this sprint. Reference implementations exist in the codebase.

### Pattern 1: `vi.hoisted` + `vi.mock` for module-level constants

**When**: File has `const x = createSomething()` at top-level (e.g., `social.ts` line 3).
**Why**: The constant is created at import time. If `createSomething` throws (e.g., env vars missing), the test crashes before mocks apply.
**Reference**: `src/lib/analytics.test.ts`

```ts
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: { from: vi.fn() /* ... */ },
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { createPlaylist } from './social';
```

### Pattern 2: `vi.stubGlobal('fetch', ...)` for fetch

**When**: File uses `fetch()` (e.g., `fetch-helpers.ts`, `game-enrichment.ts`).
**Why**: Real `fetch` makes HTTP calls. Need to replace with mock.
**Reference**: `src/services/api.test.ts`

```ts
import { vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
```

### Pattern 3: `vi.useFakeTimers` for Date.now() / setTimeout / setInterval

**When**: File uses `Date.now()`, `setTimeout`, or `setInterval` (e.g., `game-enrichment.ts:39`, `useCarousel.ts:18`, `useShareWishlist.ts:13`).
**Why**: Real timers make tests non-deterministic and slow.
**Reference**: `src/utils/pricing.test.ts`

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
// or inline: vi.setSystemTime(new Date('2026-06-19'));
```

### Pattern 4: Env var setup

**When**: File reads `process.env.X` (e.g., `server.ts:7-8`, `middleware.ts:27-28`, `cron-auth.ts:5`).
**Why**: Tests run in a clean env. Env vars must be set or mocked.

```ts
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
  process.env.CRON_SECRET = 'test-secret';
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.CRON_SECRET;
});
```

### Pattern 5: jsdom for hooks

**When**: Testing a React hook (`use*`).
**Why**: Hooks need `document`, `window`, `setTimeout`, `localStorage`.
**How**: Add `// @vitest-environment jsdom` at the top of the test file.
**Reference**: `src/hooks/useSortedGames.test.ts`

---

## Work Objectives

### Core Objective
Raise coverage from 50.7% → ~55% lines, 42.1% → ~47% branches, by adding tests to 14 small files at 0% coverage and finishing partial coverage on existing tested files in Wave 4.

### Definition of Done
- [ ] `pnpm test -- --run` passes (506 + new tests, ~600 total)
- [ ] `pnpm test:coverage` shows ≥55% lines, ≥47% branches
- [ ] `biome check .` passes
- [ ] `tsc --noEmit` passes
- [ ] 1 commit per file, conventional commit format
- [ ] PR created and pushed

### Test Pattern (from Sprint 5)

For each file:
1. Read source, list 6+ edge cases mentally (5 min, no formal SPEC)
2. Write `*.test.ts` with `describe` per function
3. Each test: specific input → specific output assertion
4. Mock only what's needed (use the patterns above)
5. 100% branch coverage on the target file

### Must Have
- Test each function in the target file (no skip/todo)
- 100% branch coverage on each target file
- Mock external dependencies (fetch, env, cookies, supabase)

### Must NOT Have
- SPEC contracts, REVIEW verdicts, friction logs
- Force-push to main
- test.skip() or test.todo()
- More than 1 commit per file
- Testing page components (out of scope — different sprint)

---

## Verification Strategy

**Zero human intervention required.** All gates run via CLI.

### Self-Gate (before push)
```bash
biome check .                                    # → 0 errors
tsc --noEmit                                      # → 0 errors
pnpm test -- --run                                # → ALL pass
pnpm test:coverage                                # → ≥55% lines, ≥47% branches
```

### Evidence per file
- Commit message: `test(scope): add N tests for X (100% branch)`
- Branch coverage per file confirmed in `pnpm test:coverage` output

---

## Execution Strategy

### 5 Waves (sequential)

```
Wave 0: Trivial hooks + supabase client (5 files, ~82 LOC, ~15 tests)
  ├── Task 0a: src/utils/supabase/client.test.ts (9 LOC, +3 tests)
  ├── Task 0b: src/hooks/useUserAlerts.test.ts (13 LOC, +3 tests)
  ├── Task 0c: src/hooks/useShareWishlist.test.ts (17 LOC, +4 tests)
  ├── Task 0d: src/hooks/useWishlistSavedGames.test.ts (32 LOC, +5 tests)
  └── Task 0e: src/lib/supabase-browser.test.ts (8 LOC, +3 tests) [Easy, singleton pattern]

Wave 1: src/services/ (3 files, ~151 LOC, ~20 tests)
  ├── Task 1a: src/services/fetch-helpers.test.ts (49 LOC, +7 tests)
  ├── Task 1b: src/services/game-enrichment.test.ts (42 LOC, +6 tests) [not deal-enrichment!]
  └── Task 1c: src/services/social.test.ts (60 LOC, +7 tests) [Hard, vi.hoisted required]

Wave 2: src/utils/supabase/ + cron-auth (2 files, ~60 LOC, ~12 tests)
  ├── Task 2a: src/lib/cron-auth.test.ts (9 LOC, +4 tests)
  └── Task 2b: src/utils/supabase/middleware.test.ts (51 LOC, +8 tests) [Medium-Hard]

Wave 3: Small hooks (3 files, ~55 LOC, ~14 tests)
  ├── Task 3a: src/hooks/useAuthSubscription.test.ts (18 LOC, +4 tests) [Medium]
  ├── Task 3b: src/hooks/useClickOutside.test.ts (14 LOC, +5 tests)
  └── Task 3c: src/hooks/useCarousel.test.ts (23 LOC, +6 tests) [Medium, fake timers]

Wave 4: Gate + PR (3 tasks)
  ├── Task 4a: pnpm test:coverage (verify ≥55% lines)
  ├── Task 4b: biome + tsc (final check)
  └── Task 4c: Push branch + create PR
```

### Total
- **14 test files** created
- **~73 new tests** (Wave 0-3 sum)
- **~373 lines of new coverage** (sum of 0% file LOC)
- **Target: 50.7% → 54.7% lines** (Wave 0-3)
- **Stretch: 50.7% → 55%+ lines** (if Wave 4 includes partial pushes)

---

## TODOs

### Wave 0: Trivial hooks + supabase client (start here — easy wins)

- [ ] 0a. **test(utils): supabase/client** — 3 tests, 100% branch

  **File**: `src/utils/supabase/client.ts` (9 LOC)
  **Pattern**: Pattern 4 (env var setup) — no mocking needed beyond env vars
  **Edge cases**:
  1. happy path with both env vars → returns client
  2. missing URL → throws
  3. missing key → throws

  **Acceptance**:
  - `pnpm test src/utils/supabase/client.test.ts` → PASS
  - Coverage on `client.ts` → 100%

- [ ] 0b. **test(hooks): useUserAlerts** — 3 tests, 100% branch

  **File**: `src/hooks/useUserAlerts.ts` (13 LOC)
  **Pattern**: Pattern 1 (vi.hoisted + vi.mock for `@/actions/alerts`) + jsdom
  **Edge cases**:
  1. enabled=true → calls queryFn
  2. enabled=false → does not call queryFn
  3. queryKey is `['alerts']`, staleTime is 30s

  **Acceptance**:
  - `pnpm test src/hooks/useUserAlerts.test.ts` → PASS
  - Coverage → 100%

- [ ] 0c. **test(hooks): useShareWishlist** — 4 tests, 100% branch

  **File**: `src/hooks/useShareWishlist.ts` (17 LOC)
  **Pattern**: Pattern 3 (fake timers) + jsdom
  **Edge cases**:
  1. initial state `copied=false`
  2. `share()` sets `copied=true`, calls `navigator.clipboard.writeText` with right URL
  3. after 2500ms, `copied` resets to `false`
  4. URL uses base64-encoded wishlist

  **Acceptance**:
  - `pnpm test src/hooks/useShareWishlist.test.ts` → PASS
  - Coverage → 100%

- [ ] 0d. **test(hooks): useWishlistSavedGames** — 5 tests, 100% branch

  **File**: `src/hooks/useWishlistSavedGames.ts` (32 LOC)
  **Pattern**: jsdom + mock `@/services/api` for `getHighResImage`
  **Edge cases**:
  1. empty gameResults → empty array
  2. game with `null` info → skipped
  3. game with deals → uses cheapest for `salePrice` and `savings`
  4. game without deals → uses `cheapestPriceEver`
  5. memoized result (same input → same reference)

  **Acceptance**:
  - `pnpm test src/hooks/useWishlistSavedGames.test.ts` → PASS
  - Coverage → 100%

- [ ] 0e. **test(lib): supabase-browser** — 3 tests, 100% branch

  **File**: `src/lib/supabase-browser.ts` (8 LOC)
  **Pattern**: Pattern 1 (vi.hoisted for `createClient` mock) + Pattern 4 (env vars)
  **Edge cases**:
  1. first call → creates client
  2. second call → returns SAME instance (singleton)
  3. `createClient` throws when env missing → propagates error

  **Acceptance**:
  - `pnpm test src/lib/supabase-browser.test.ts` → PASS
  - Coverage → 100%

### Wave 1: src/services/

- [ ] 1a. **test(services): fetch-helpers** — 7 tests, 100% branch

  **File**: `src/services/fetch-helpers.ts` (49 LOC)
  **Pattern**: Pattern 2 (vi.stubGlobal fetch) + Pattern 4 (env vars not needed here)
  **Exports**: `fetchDealsWithFallback`, `fetchGameDetails`
  **Edge cases for `fetchDealsWithFallback`**:
  1. res.ok=false → returns `fallbackDeals`
  2. success with empty data → returns `fallbackDeals`
  3. success with data → returns parsed data
  4. fetch throws (network error) → returns `fallbackDeals` + console.error
  5. JSON parse throws → returns `fallbackDeals`
  6. custom `errorContext` is used in console.error
  **Edge cases for `fetchGameDetails`**:
  7. res.ok=false → returns `null`; fetch throws → returns `null`

  **Acceptance**:
  - `pnpm test src/services/fetch-helpers.test.ts` → PASS
  - Coverage → 100%

- [ ] 1b. **test(services): game-enrichment** — 6 tests, 100% branch

  **File**: `src/services/game-enrichment.ts` (42 LOC) **[NOT deal-enrichment — file doesn't exist]**
  **Pattern**: Pattern 2 (vi.stubGlobal fetch) + Pattern 3 (fake timers for `Date.now()`)
  **Exports**: `fetchGameFromCheapShark`, `enrichWithGreyMarketDeals`, `updateHistoricalLow`
  **Edge cases for `fetchGameFromCheapShark`**:
  1. res.ok=false → returns `null`
  2. success → returns parsed game
  3. fetch throws → returns `null`
  **Edge cases for `enrichWithGreyMarketDeals`**:
  4. game with deals → mutates `game.deals` (appends grey market)
  5. game with no deals → no-op
  **Edge cases for `updateHistoricalLow`**:
  6. current lowest < historical low → updates price + date (uses `Date.now()`)
  7. current lowest >= historical low → no-op

  **Acceptance**:
  - `pnpm test src/services/game-enrichment.test.ts` → PASS
  - Coverage → 100%

- [ ] 1c. **test(services): social** — 7 tests, 100% branch [HARD]

  **File**: `src/services/social.ts` (60 LOC)
  **Pattern**: Pattern 1 (vi.hoisted + vi.mock `@/utils/supabase/client`) — REQUIRED because line 3 has `const supabase = createClient()`
  **Exports**: `createPlaylist`, `getUserPlaylists`, `addGameToPlaylist`
  **Edge cases for `createPlaylist`**:
  1. happy path → returns playlist
  2. supabase returns error → throws
  **Edge cases for `getUserPlaylists`**:
  3. happy path → returns playlists array
  4. supabase returns error → throws
  **Edge cases for `addGameToPlaylist`**:
  5. game already in list → no-op (no update call)
  6. game not in list → appends + updates
  7. playlist not found → no-op
  8. update throws → throws

  **Acceptance**:
  - `pnpm test src/services/social.test.ts` → PASS
  - Coverage → 100%

### Wave 2: src/utils/supabase/ + cron-auth

- [ ] 2a. **test(lib): cron-auth** — 4 tests, 100% branch

  **File**: `src/lib/cron-auth.ts` (9 LOC)
  **Pattern**: Pattern 4 (env var setup) — no mocking beyond env
  **Export**: `verifyCronAuth`
  **Edge cases**:
  1. valid `Bearer <CRON_SECRET>` header + env set → returns `null` (no redirect)
  2. missing `CRON_SECRET` env → returns 401 JSON
  3. wrong token → returns 401 JSON
  4. missing `Authorization` header → returns 401 JSON

  **Acceptance**:
  - `pnpm test src/lib/cron-auth.test.ts` → PASS
  - Coverage → 100%

- [ ] 2b. **test(utils): supabase/middleware** — 8 tests, 100% branch [MEDIUM-HARD]

  **File**: `src/utils/supabase/middleware.ts` (51 LOC)
  **Pattern**: Pattern 1 (vi.hoisted for `@supabase/ssr` and `next/server`) + Pattern 4
  **Exports**: `updateSession` (only public function)
  **Internal**: `isProtectedPath`, `enforceAuthGate`
  **Edge cases for `updateSession`**:
  1. missing env vars → throws
  2. no user + protected path (`/wishlist`) → redirect to `/?auth=required`
  3. user + protected path → no redirect
  4. no user + `/auth` path → no redirect
  5. user + `/auth` path → redirect to `/profile`
  6. unprotected path + user → no redirect
  7. `setAll` callback mutates request cookies AND supabaseResponse cookies
  8. unprotected path + no user → no redirect

  **Acceptance**:
  - `pnpm test src/utils/supabase/middleware.test.ts` → PASS
  - Coverage → 100%

### Wave 3: Small hooks

- [ ] 3a. **test(hooks): useAuthSubscription** — 4 tests, 100% branch [MEDIUM]

  **File**: `src/hooks/useAuthSubscription.ts` (18 LOC)
  **Pattern**: Pattern 1 (vi.mock `@/lib/supabase-browser` and `@/store/authStore`) + jsdom
  **Edge cases**:
  1. mounts → calls `supabase.auth.onAuthStateChange` with callback
  2. unmounts → calls `subscription.unsubscribe()` (cleanup)
  3. callback with `session.user` → calls `setUser(user)`
  4. callback with `null` session → calls `setUser(null)` (per PR #19 lesson — NO signOut)

  **Acceptance**:
  - `pnpm test src/hooks/useAuthSubscription.test.ts` → PASS
  - Coverage → 100%

- [ ] 3b. **test(hooks): useClickOutside** — 5 tests, 100% branch

  **File**: `src/hooks/useClickOutside.ts` (14 LOC)
  **Pattern**: jsdom + renderHook from `@testing-library/react`
  **Edge cases**:
  1. click outside ref → fires callback
  2. click inside ref → does not fire
  3. `mousedown` (not `click`) → fires
  4. `ref.current=null` → no-op
  5. unmount → removes `mousedown` listener (cleanup)

  **Acceptance**:
  - `pnpm test src/hooks/useClickOutside.test.ts` → PASS
  - Coverage → 100%

- [ ] 3c. **test(hooks): useCarousel** — 6 tests, 100% branch [MEDIUM]

  **File**: `src/hooks/useCarousel.ts` (23 LOC)
  **Pattern**: jsdom + Pattern 3 (vi.useFakeTimers for setInterval)
  **Edge cases**:
  1. initial `currentIndex=0`
  2. `next()` → 0 → 1
  3. `next()` wrap (last → 0)
  4. `next()` no-op when `totalSlides=0`
  5. `prev()` → 0 → last (wrap)
  6. `prev()` no-op when `totalSlides=0`
  7. `goTo(index)` → jumps to index
  8. auto-advance: `setInterval` advances via `next` after `intervalMs`
  9. `totalSlides<=1` → no interval set
  10. unmount → `clearInterval` (cleanup)

  **Acceptance**:
  - `pnpm test src/hooks/useCarousel.test.ts` → PASS
  - Coverage → 100%

### Wave 4: Gate + PR

- [ ] 4a. **Run coverage check** — verify ≥55% lines

  **What to do**:
  - `pnpm test:coverage` after Wave 0-3 commits
  - Confirm overall coverage ≥55% lines, ≥47% branches
  - If below target, add 1-2 partial-coverage files to push to 100%:
    - `src/hooks/usePlaylistMutations.ts` (75% branch → 100%)
    - `src/hooks/useSortedGames.ts` (83% branch → 100%)
    - `src/hooks/useWishlistGames.ts` (50% branch → 100%)

- [ ] 4b. **Final self-gate**

  **What to do**:
  - `./node_modules/.bin/biome check .` → 0 errors
  - `./node_modules/.bin/tsc --noEmit` → 0 errors
  - `pnpm test -- --run` → ALL pass

- [ ] 4c. **Create PR**

  **What to do**:
  - `git push -u origin feat/sprint6-coverage`
  - `gh pr create` with summary: "Sprint 6 — coverage push 50.7% → 55%+"

---

## Commit Strategy

- 1 commit per file: `test(scope): add N tests for X (100% branch)`
- Subject ≤50 chars, body lists edge cases
- Order: Wave 0 (trivials) → Wave 1 (services) → Wave 2 (supabase) → Wave 3 (hooks) → Wave 4 (gate/PR)
- Each commit: file changes + run gate locally

---

## Success Criteria

- [ ] All 14 target files have tests
- [ ] Each target file: 100% branch coverage
- [ ] Overall coverage: ≥55% lines, ≥47% branches
- [ ] Self-gate (biome + tsc + test + coverage) passes
- [ ] PR created for review

---

## Out of Scope (defer to future sprints)

- `src/hooks/useSyncHooks.ts` (85 lines, 17% — better in dedicated sprint)
- `src/providers/queryProvider.tsx` (13 lines, trivial wrapper, low value)
- `src/app/*/page.tsx` pages (server components, need RSC testing)
- `src/components/*` (37% coverage — visual regression covers most)
- Pushing existing partial-coverage files to 100% (only in Wave 4 fallback)
