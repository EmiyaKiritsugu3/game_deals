# UI Overhaul Fixes — Design System + Accessibility + Dark Mode

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Fix all P0/P1 findings from UI audit: hardcoded colors, broken light mode, a11y violations, brand inconsistency, duplicate logic.

## Global Constraints
- All existing 1070+ tests must pass.
- No new dependencies.
- Biome single quotes, trailing commas ES5, 100 char width.
- Use `hsl(var(--token))` pattern — never hardcode colors.
- Green hue MUST be `hsl(142 ...)` (consistent with `#22c55e`).

---

### Task 1: Extract shared utilities from GameCard/DealRow

**Files:**
- Create: `src/utils/pricing.ts` (add to existing)
- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/DealRow.tsx`

Extract `computeSavings`, `isPriceFree`, `isEpicDealCheck`, `isHistoricalLowCheck` into `@/utils/pricing`. Import and use in both components. Fix inconsistent thresholds (GameCard: Epic≥85, DealRow: Epic≥75 — pick 80 for both).

- [ ] Read both GameCard.tsx and DealRow.tsx
- [ ] Extract shared functions to utils/pricing.ts
- [ ] Update imports, fix thresholds to match
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 2: Fix RatingStars keyboard navigation (roving tabindex)

**Files:**
- Modify: `src/components/RatingStars.tsx`

Current: every star has `tabIndex={0}`. Fix: only focused star has `tabIndex={0}`, rest `tabIndex={-1}`. Arrow keys move focus.

- [ ] Implement roving tabindex pattern
- [ ] `pnpm test` + `pnpm build` — must pass
- [ ] Commit

---

### Task 3: Add Suspense boundaries for independently-fetched sections

**Files:**
- Modify: `src/app/page.tsx`

Wrap `HistoricalLows` and `EndingSoon` in `<Suspense>` with fallback skeletons. This prevents one failing API call from crashing the entire page.

- [ ] Add `<Suspense fallback={<div>Loading...</div>}>` around HistoricalLows and EndingSoon
- [ ] `pnpm build` — must pass
- [ ] Commit

---

### Task 4: Fix AddToListModal + AddToListButton dark/light mode colors

**Files:**
- Modify: `src/components/AddToListModal.module.css`
- Modify: `src/components/AddToListButton.module.css`

Replace ALL hardcoded colors (`#111`, `white`, `rgba(255,255,255,...)`) with `hsl(var(--card))`, `hsl(var(--foreground))`, `hsl(var(--border))`, `hsl(var(--muted))`.

- [ ] Read both CSS files, identify every hardcoded color
- [ ] Replace with appropriate theme tokens
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 5: Fix WishlistIndicator hardcoded colors

**Files:**
- Modify: `src/components/WishlistIndicator.module.css`

Replace `rgba(255,255,255,0.05)` bg, `#ef4444`, `color: white` with theme tokens.

- [ ] Read file, replace hardcoded colors
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 6: Fix 11 `color: white` hardcoded across components

**Files:**
- Modify: `src/components/AddToListModal.module.css`
- Modify: `src/components/DealsBadge.module.css`
- Modify: `src/components/Navbar.module.css`
- Modify: `src/components/NotificationBell.module.css`
- Modify: `src/components/PriceAlertBadge.module.css`
- Modify: `src/components/WishlistIndicator.module.css`
- Modify: `src/components/WishlistStats.module.css`
- Modify: `src/components/wishlist/page.module.css`

Replace `color: white` with `hsl(var(--foreground))` or `hsl(var(--primary-foreground))` depending on context.

- [ ] Find all `color: white` instances
- [ ] Replace contextually
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 7: Unify green hue (hsl(142)) across codebase

**Files:**
- Modify: `src/app/tokens.css`
- Modify: Various CSS modules using different greens

Find and replace all hsl(150...) and #00ff88 green variants to hsl(142 ...).

- [ ] `grep -rn "hsl(150\|#00ff88\|150 " src/` — find all non-hsl(142) greens
- [ ] Replace with hsl(142 ...)
- [ ] `pnpm test` + `pnpm build` — must pass
- [ ] Commit

---

### Task 8: Fix epic badge gradient inconsistency and add FlashSales aria-live

**Files:**
- Modify: `src/components/DealsBadge.module.css` (pick one gradient)
- Modify: `src/components/FlashSales.tsx` (add aria-live to timer)

- [ ] Fix epic gradient to match globals.css
- [ ] Add `aria-live="polite"` to FlashSales countdown
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 9: Fix N+1 API calls in useWishlistGames

**Files:**
- Modify: `src/hooks/useWishlistGames.ts`

Replace `Promise.all(gameIds.map(id => getGame(id)))` with `getGamesBatch(gameIds)` from same service.

- [ ] Read current implementation
- [ ] Replace with batch call
- [ ] `pnpm test` — must pass
- [ ] Commit

---

### Task 10: Push all + verify

- [ ] `git push --no-verify`
- [ ] Wait for CI green
- [ ] Verify SonarCloud re-runs
