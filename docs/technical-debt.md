# Technical Debt Register

Tracking known technical debt items across the GameDeals codebase. Items prioritized by impact.

---

## P1 — Complexity Suppressions (12 suppressors)

**Issue:** 12 `// fallow-ignore-next-line complexity` comments suppress cognitive complexity warnings across 7 files. These functions are genuine complexity hotspots that should be refactored.

| File | Function | Suppressor Lines |
|------|----------|-----------------|
| `src/actions/alerts.ts` | `createPriceAlertAction` | 1 |
| `src/actions/deals.ts` | `getDealsAction`, `ingestPricesAction` | 2 |
| `src/actions/playlists.ts` | 2 playlist functions | 2 |
| `src/components/Navbar.tsx` | 3 component functions | 3 |
| `src/components/NotificationBell.tsx` | component + map callback | 2 |
| `src/components/SyncManager.tsx` | 2 useEffects | 2 |
| `src/app/api/cron/check-alerts/route.ts` | cron route | 1 |

**Fix:** Extract sub-functions, reduce conditional nesting. `getDealsAction` already done (16→4 cognitive); apply same pattern.

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

## P6 — Knip: Unused Exports (10 functions, 5 types)

**Issue:** Knip reports 10 unused function exports and 5 unused type exports. Some are intended for future use (gamification, social), others are genuinely dead.

**Functions:**
- `useWeeklyPriceHistory` (hook)
- `TYPESENSE_COLLECTION_NAME`, `createAdminClient`, `createSearchClient`, `createTypesenseAdapter`, `indexGame` (Typesense)
- `generatePriceHistory` (service)
- `getUserStats`, `getUserBadges`, `checkAchievements` (social)

**Types:**
- `BundleGame`, `PriceAlert`, `GameInfo`, `LowestPrice`, `Badge`

**Fix:** Review each — either delete, un-export, or add `// fallow-ignore-next-line unused-export`.

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
