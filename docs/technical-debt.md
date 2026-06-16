# Technical Debt Register

Tracking known technical debt items across the GameDeals codebase. Items prioritized by impact.

---

## P1 — Complexity Suppressions (10 suppressors, was 12)

**Issue:** 10 `// fallow-ignore-next-line complexity` comments suppress cognitive complexity warnings across 5 files (was 7 files, 12 suppressors). Improvements from PR #13 + #14:

| File | Function | Suppressor Lines |
|------|----------|-----------------|
| `src/actions/alerts.ts` | `createPriceAlertAction` | 1 |
| `src/actions/deals.ts` | `getDealsAction`, `ingestPricesAction` | 2 |
| `src/components/SyncManager.tsx` | 2 useEffects | 2 |
| `src/actions/search.ts` | `syncGamesToTypesenseAction`, `createTypesenseCollectionAction` | 2 |
| `src/app/api/cron/check-alerts/route.ts` | cron route | 1 |

**Reductions (PR #13):** `Navbar.tsx` (3 → 0, refactored to sub-components), `playlists.ts` (2 → 0, deleted), `NotificationBell.tsx` (2 → 1, simplified).
**Reduction (PR #14):** Fallow CRITICAL functions: 1 → 0 (extracted `buildGameEntry` helper).

**Fix:** Continue extracting sub-functions. Remaining 10 suppressors are in stable functions with acceptable complexity for their domain.

---

## P2 — SyncManager: Cloud→Local Wishlist Sync Removed

**Issue:** PR #12 refactored `SyncManager.tsx` and removed the `loadFromCloud` useEffect that loaded wishlist from Supabase on login. Users logging in on a new device won't see their cloud wishlist in local state until they manually add an item.

**File:** `src/components/SyncManager.tsx`

**Fix:** Re-add a mount effect that loads wishlist from `supabase.from('wishlists').select('gameId')` and merges with local state, guarded by `hasLoadedWishlist` ref.

---

## P3 — Stale Docs: `setWishlist` References

**Issue:** After removing `setWishlist` from `wishlistStore.ts`, 4 doc files still reference it:

| File | Context |
|------|---------|
| `docs/architecture/c4-component.md:176` | `setWishlist()` for remote sync hydration |
| `docs/manual/03-gamification-and-state.md:39` | Interface definition |
| `docs/manual/03-gamification-and-state.md:43` | Description of remote sync |

**Fix:** Update doc references or remove them.

---

## P4 — ingestPricesAction: No onConflictDoUpdate

**Issue:** The deals insert in `ingestPricesAction` (`src/actions/deals.ts:222`) has no `onConflictDoUpdate` clause. Each cron run inserts duplicate deal rows. Games and price_history use upsert patterns, but deals doesn't.

**Impact:** `deals` table accumulates duplicate rows over time. `SELECT MIN(price)` in alert queries still works (returns correct min), but table bloat increases.

**Fix:** Add `ON CONFLICT (gameId, storeId) DO UPDATE SET price = EXCLUDED.price, ...` on the deals insert. Requires a unique constraint on `(gameId, storeId)`.

---

## P5 — lint-staged: Biome Fails on Markdown Files

**Issue:** `lint-staged` runs `biome check --write` on `*.{json,css,md}` files. Biome does not process `.md` files, returns exit code 1 with "No files processed." This blocks any commit that includes `.md` files unless `--no-verify` is used.

**File:** `package.json` (`lint-staged` config)

**Fix:** Remove `md` from lint-staged pattern, or add a dedicated markdown linter.

---

## P6 ✅ — (CLOSED) Knip: Unused Exports (10 functions, 5 types)

**Issue (resolved):** Knip reported 10 unused function exports and 5 unused type exports.

**Resolution (PR #14):**
- **Types (✅ FIXED):** 7 types un-exported (internalized), 2 types deleted entirely (UserStats, UserBadge). **0 unused types remaining.**
- **Functions (✅ FIXED):** Gamification.ts and playlists.ts deleted (whole feature removed). `generatePriceHistory` removed from re-exports. **0 unused functions remaining.**
- **Typesense functions (⚠️ WAIVED):** `TYPESENSE_COLLECTION_NAME`, `createAdminClient`, `createSearchClient`, `createTypesenseAdapter`, `indexGame` are legitimately unused in production but kept as utility API. Ignored in knip config.
- **Social functions (⚠️ WAIVED):** `getUserStats`, `getUserBadges`, `checkAchievements` are placeholders for future social features. Ignored in knip config.

---

## P7 — Missing Snapshot Files

**Issue:** `drizzle/meta/` has snapshot files only for 0000 and 0001. Migrations 0002-0007 are custom SQL without corresponding snapshot JSONs. `drizzle-kit check` errors with malformed snapshot data.

**Impact:** Cannot use `drizzle-kit generate` after modifying schema without manual cleanup.

**Fix:** Run `pnpm db:generate --custom` or manually create snapshot stubs for 0002-0007.

---

## P8 — Pre-Existing: Double Encoding in sanitizeTitle

**Issue:** `sanitizeTitle()` calls `encodeURIComponent()` on the title, then `buildDealsUrl()` appends it via `url.searchParams.append()` which also encodes. Result: double-encoded titles in CheapShark API URLs.

**File:** `src/actions/deals.ts:35`

**Impact:** Search by title with special characters may return empty results from CheapShark.

**Fix:** Remove `encodeURIComponent()` from `sanitizeTitle` — `URLSearchParams` handles encoding.

---

## P9 — Pre-Existing: Fallow Exit 1 on Pre-Push

**Issue:** `pnpm check` (pre-push hook) runs fallow which exits 1 on any finding. The CI pipeline excludes fallow. Two inherited complexity findings + one clone group in `ingestPricesAction` block local pushes.

**Fix:** Either add fallow `--ci` mode to exit 0 on warnings, or fix the inherited findings.

---

## P10 — Sprint 15: Dual-Storage Architecture for Alerts

**Issue:** Price alerts have two sources of truth:
1. **`useAlerts`** (Zustand + localStorage) — populated by `PriceAlertModal.tsx`, read by game page badge and wishlist AlertsGrid
2. **`price_alerts` table** (Supabase) — populated by `SyncManager` (1s debounce), read by standalone `/alerts` page via `getUserAlertsAction`

**Impact:** Alerts created via the modal never display on `/alerts` until SyncManager runs. If user closes tab in <1s, the alert is lost from DB but persisted in localStorage — then SyncManager on next page visit re-creates it (divergence).

**Introduced:** Preexisting (worse after Sprint 15 added DB-first `/alerts` page).

**Fix:** Refactor `PriceAlertModal` to call server actions directly (`createPriceAlertAction`/`deletePriceAlertAction`) instead of localStorage-only. Remove `SyncManager` alerts sync. Migrate consumers to read from DB via TanStack Query.

**Estimate:** 1-2 days.

---

## P11 — Sprint 15: deletePriceAlertAction Non-Atomic

**Issue:** `deletePriceAlertAction` does SELECT then DELETE in separate queries. Race condition if ownership changes between the two (low risk — user IDs don't change).

**Fix:** `DELETE FROM price_alerts WHERE id = $1 AND "userId" = $2` — single atomic query.

---

## P12 — Sprint 15: alerts/page.tsx Complexity

**Issue:** `AlertsPage` component has 78 lines of JSX, 13 cyclomatic complexity, 49.5 CRAP score. Fallow flags as high-risk.

**Fix:** Extract `AlertCard` sub-component (reduces page from 205 to ~100 lines).

---

## P13 — Sprint 15: BrowseButton Shadow Color

**Resolved:** `src/app/alerts/page.module.css` — `browseButton:hover` shadow changed from hardcoded `rgba(220, 38, 38, 0.4)` to `hsl(var(--primary) / 0.4)` (brand color). Same fix applied to `wishlist/page.module.css`.

---

## P14 — Sprint 15: E2E Test Gap

**Issue:** No E2E test covers the actual alerts CRUD flow (create → list → delete). All 6 E2E tests are smoke tests (page renders, cron auth). To fully test end-to-end, an auth flow is needed — requires seeded Supabase user or per-test auth session.

**Fix:** Add a Playwright test that authenticates as a test user, navigates to game page, creates alert via modal, navigates to `/alerts`, asserts card renders, clicks Remove, asserts card removed.

**Estimate:** 4h.

---

## P15 — (DEFERRED) Cubic Review: 7 Comments Deferred

**Issue:** cubic.dev AI code review on PR #14 identified 13 issues. 6 were fixed in PR #14, 7 deferred.

**Fixed (PR #14):**
- P1: `SearchResults.tsx` — `styles.resultsArea` undefined in CSS module
- P1: `useCarousel.ts` — mod-by-zero crash
- P2: `HeroNavigation.tsx` — O(n²) indexOf in map
- P2: `GameHero.tsx` — missing `sizes` on `<Image fill>`
- P2: `GameStatsRow.tsx` — raw float without toFixed(2)
- P2: `AlertFormFields.tsx` — X icon labeled as checkmark

**Deferred (requires separate PR):**
- P2: `UserMenu.tsx` — button containing links (a11y)
- P2: `search.ts` — HTTP status code swallowed
- P2: `BaseModal.tsx` — dialog without accessible name
- P2: `useAuthSubscription.ts` — logout inside onAuthStateChange
- P2: `WishlistGrid.tsx` — absolute positioned heart button
- P2: `GameBody.tsx` — redundant `bestCurrentPrice` in viewModel
- P3: `AlertsGrid.tsx` — opacity compounding (inline + CSS)
