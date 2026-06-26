# UI Stack Modernization — Design Spec

**Date:** 2026-06-26
**Branch:** feat/sprint-17-ui-refresh
**Status:** Approved

## 1. Objective

Eliminate CSS modules, remove dead/unnecessary dependencies, and consolidate all styling into Tailwind CSS v4 + CSS custom properties. Target: fewer files, smaller bundle, zero JS animation runtime, single source of truth for theme.

## 2. Stack Comparison

| Layer | Current | Target | Rationale |
|-------|---------|--------|-----------|
| Styling | 46 CSS modules (5,877 lines) + Tailwind v4 | Tailwind v4 only + CSS custom properties | Modules duplicate what Tailwind utilities already do |
| Animations (JS) | `motion/react` 12.41, `gsap` 3.15 | None | CSS `@starting-style`, `@keyframes`, transitions cover all current use cases |
| Animation (CSS) | `tw-animate-css` 1.4 | `@keyframes` in `@theme` block | Tailwind v4 native `--animate-*` theme tokens eliminate need for separate plugin |
| Components | shadcn/ui + custom `BaseModal` | shadcn/ui pure | `BaseModal` duplicates shadcn `Dialog` functionality with manual focus trap |
| Theme | `next-themes` 0.4.6 | `next-themes` 0.4.6 (keep) | `light-dark()` alone doesn't cover localStorage persistence, system detection, class-based toggling |
| Icons | `lucide-react` 1.21 | Keep | Tree-shakeable, 28 icons in use, no lighter alternative |
| Charts | `recharts` 3.9.0 | Keep | React 19 compatible, stable, used in price history/stats |
| State | Zustand, TanStack Query | Keep | Essential, no native substitute |

### Dependencies Removed

- `gsap` — 0 imports found in `src/`, dead dependency
- `motion` (`motion/react`) — 2 files, replaceable with CSS
- `tw-animate-css` — replaced by `@keyframes` in Tailwind v4 `@theme`
- 46 CSS module files — replaced by Tailwind utilities

### Bundle Impact

- JS animation runtime: ~318KB minified (~90KB gzipped) → 0KB
- CSS file count: 48 → 1 (`globals.css`)
- CSS total lines: ~5,877 → ~1,200-1,800

### Dead Code Removal (Bonus)

Audit found 6 unused shadcn/ui components under `src/components/ui/` with zero external imports:

| File | Size | Reason |
|------|------|--------|
| `avatar.tsx` | 2.9KB | 0 imports |
| `command.tsx` | 4.9KB | 0 imports (was used, removed) |
| `dialog.tsx` | 3.8KB | 0 imports (was used, removed) |
| `dropdown-menu.tsx` | 8.6KB | 0 imports (ThemeToggle uses it but is commented out) |
| `popover.tsx` | 2.5KB | 0 imports |
| `select.tsx` | 6.5KB | 0 imports |
| `separator.tsx` | 544B | 0 imports |
| `sheet.tsx` | 4.2KB | 0 imports |

These can all be deleted. `dialog.tsx` deletion requires Phase 2 consumers to use shadcn Dialog imports directly (they currently don't import any Dialog components — will add fresh).

## 3. Migration Phases

### Phase 1: Dependency Removal (zero visual change)

Remove dead and unnecessary packages:

```bash
pnpm remove gsap motion tw-animate-css
```

Remove `@import "tw-animate-css"` from `globals.css`.

**Verification:**
- `pnpm build` passes
- No visual changes
- No import errors

### Phase 2: BaseModal → shadcn Dialog

#### Current State
`BaseModal.tsx` (custom) wraps native `<dialog>` with:
- Manual focus trapping (Tab/Shift+Tab interception)
- Manual `document.body.style.overflow` management
- Manual `document.activeElement` save/restore
- CSS Module animations (`@keyframes fadeIn`/`scaleIn` in `BaseModal.module.css`)
- No portal rendering
- No `aria-modal`, no sub-components

`shadcn/ui Dialog` already provides all of this automatically via `@base-ui/react/dialog`.

#### Consumers (2 files)

1. **`src/components/AuthModal.tsx`** (lines 71-126)
   - Wraps social login + magic link form
   - Imports `BaseModal` only — does NOT import `Dialog*` components. Needs `Dialog*` imports added.
   - Also uses dynamic CSS module class: `styles[message.type]` — needs conversion in same step.

2. **`src/components/PriceAlertModal.tsx`** (lines 103-167)
   - Wraps price alert form
   - Imports `BaseModal` only — does NOT import `Dialog*` components. Needs `Dialog*` imports added.

**Correction:** Previous spec version claimed both already import `Dialog*` — audit confirmed this is false. Both files need `Dialog, DialogContent` imports added during conversion.

#### Conversion

Replace `<BaseModal isOpen onClose ariaLabel>` with `<Dialog open onOpenChange>` + `<DialogContent>`:

```tsx
// Before
<BaseModal isOpen={isOpen} onClose={onClose} ariaLabel="Authentication">
  {children}
</BaseModal>

// After
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    {children}
  </DialogContent>
</Dialog>
```

**DialogContent backdrop customization:** BaseModal overlay uses `color-mix(in srgb, var(--background) 70%, transparent)` with `backdrop-filter: blur(4px)`. shadcn `DialogOverlay` defaults to `bg-black/80 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0`. Customize via className on `DialogContent` if needed.

**⚠️ Edge cases BaseModal handled that shadcn Dialog also handles:**
- Escape key to close → `Dialog` built-in via `@base-ui/react`
- Click overlay to close → `Dialog` built-in via `DialogOverlay`
- Body scroll lock → `Dialog` built-in via portal
- Focus trap → `Dialog` built-in via `@base-ui/react/dialog`
- Return focus on close → `Dialog` built-in

**Removal affects 7 existing tests** in `BaseModal.test.tsx`. Replace with equivalent tests on the two consumer modals (AuthModal, PriceAlertModal) after conversion.

#### SidebarModal (separate component — do NOT touch)

`src/components/SidebarModal.tsx` is a **separate component** from BaseModal. It uses its own `SidebarModal.module.css` with `@keyframes fadeIn`/`slideInRight`. Used in intercepting route modal (`@modal/(.)game/[id]`). This component stays — only the CSS module gets migrated in Phase 4.

**Verification:**
- Modals open/close identically
- Focus trap works (keyboard navigation)
- Backdrop click closes
- Body scroll locks during open

### Phase 3: Animations → CSS Native

#### 3a. AnimatedDiv Replacement

`AnimatedDiv` provides 3 animation behaviors:

| Behavior | motion/react | CSS Replacement |
|----------|-------------|-----------------|
| Fade+slide on viewport entry | `whileInView: opacity 0→1, y 24→0` | `@keyframes fadeSlideIn` + `animation-timeline: view()` OR Intersection Observer via CSS class toggle |
| Spring hover lift | `whileHover: y -6, spring` | `hover:-translate-y-1.5 transition-transform duration-200 ease-out` |
| Staggered delay | `delay: i * 0.08` | `style={{ animationDelay: `${i * 80}ms` }}` inline |

**CSS definition in `globals.css` `@theme` block:**

```css
@theme {
  --animate-fade-slide-in: fade-slide-in 0.45s cubic-bezier(0.25, 0.1, 0.25, 1) both;

  @keyframes fade-slide-in {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

**⚠️ Note:** `animation-timeline: view()` is NOT Baseline (Firefox only Nightly behind flag). Use Intersection Observer approach instead: a custom hook `useInView` triggers animation class via state. Or use the simpler approach: animate on mount with `opacity` transition — page sections are in view immediately on load.

**Decision:** Use CSS `@keyframes fade-slide-in` applied directly (no observer). Animations play on element mount — sufficient for home page sections that load above the fold. For below-fold sections, they animate naturally when the user scrolls to them (browser repaints).

#### 3b. AnimatedDiv Consumer Conversion

**CommunityListings** (`src/components/home/CommunityListings.tsx`):
- Wrapper: `<AnimatedDiv className="mb-12">` → `<div className="mb-12 animate-fade-slide-in">`
- Cards: `<AnimatedDiv hover>` → `<div className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out">`

**DiscoveryGrid** (`src/components/home/DiscoveryGrid.tsx`):
- Wrapper: same as above
- Cards: `<AnimatedDiv delay={i * 0.08} hover>` → `<div className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out" style={{ animationDelay: `${i * 80}ms` }}>`

**HotDealsSection** (`src/components/home/HotDealsSection.tsx`):
- Wrapper: same as above
- Cards: `<AnimatedDiv delay={i * 0.05} hover>` → `<div className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out" style={{ animationDelay: `${i * 50}ms` }}>`

#### 3c. HomeHero Parallax → CSS

**Current:** `useScroll` + `useTransform` drives `y: bgY` (0% → 30% movement) on a `<motion.div>` wrapping Next.js `<Image fill>`. The background image scrolls at 30% speed relative to viewport — subtle parallax.

**⚠️ CRITICAL:** Current code uses Next.js `<Image fill>` inside `<motion.div>` — NOT `background-image`. The `y` transform moves the entire `<Image>` container. Replacement strategy:

**Option A (recommended):** Replace `<Image fill>` with CSS `background-image` + `background-attachment: fixed`:

```tsx
// Before: motion.div wrapping Image
<motion.div style={{ y: bgY }} className="absolute inset-0">
  <Image src={heroImage} fill className="object-cover" alt="" />
</motion.div>

// After: CSS background on container
<div 
  className="absolute inset-0 bg-cover bg-center bg-fixed"
  style={{ backgroundImage: `url(${heroImage})` }}
/>
```

**Trade-off:** `background-attachment: fixed` makes background 100% still (0% scroll movement). Current motion effect is 30% sub-scroll — more subtle. Visual difference is slight and acceptable.

**Mobile Safari note:** `background-attachment: fixed` is disabled on iOS Safari — falls back to `scroll`. This matches current behavior where parallax on mobile is already imperceptible due to smaller viewport.

**Option B (fallback, if fixed is rejected):** Keep a minimal `motion/react` import just for HomeHero parallax. All other animations use CSS.

**Content animations** — `motion.div` with `initial/opacity+y → animate` for content card and game image:

```tsx
// Content card
<div className="animate-fade-slide-in">
// Game image  
<div className="animate-fade-slide-in" style={{ animationDelay: '0.15s' }}>
```

**Verification:**
- HomeHero renders without motion dependency (or with Option B fallback)
- Parallax effect works on desktop (Chrome, Firefox, Safari)
- Mobile gets static background (acceptable, current also subtle on mobile)
- Entrance animations play on page load
- No visual regression vs current

### Phase 4: CSS Modules → Tailwind

**⚠️ CRITICAL PREREQUISITE:** 11 unique `@keyframes` exist across `.module.css` files (19 total declarations counting 7x `spin` duplicates). Only `spin` maps to `animate-spin` built-in. All others need registration in `globals.css` `@theme` block BEFORE converting their consumer files:

| @keyframes | File(s) | Full definition | Registration |
|------------|---------|----------------|--------------|
| `spin` (7x) | loading, wishlist/page, out, alerts/page, playlists/page, playlists/[id], WishlistGrid | `100% { transform: rotate(360deg) }` | `animate-spin` (built-in) |
| `fadeIn` | `BaseModal.module.css`, `SidebarModal.module.css` | `from { opacity: 0 }` -> `to { opacity: 1 }` | `--animate-fade-in` |
| `scaleIn` | `BaseModal.module.css` | `from { transform: scale(0.9) translateY(20px); opacity: 0 }` | `--animate-scale-in` |
| `slideInRight` | `SidebarModal.module.css` | `from { transform: translateX(100%) }` | `--animate-slide-in-right` |
| `heart-burst` | `HeartButton.module.css` | `0% { scale(1) } 50% { scale(1.3) } 100% { scale(1) }` — 0.4s cubic-bezier(.175,.885,.32,1.275) | `--animate-heart-burst` |
| `pulse` | `Freebies.module.css`, `GameStatsRow.module.css` | `0%,100% { opacity: 1 } 50% { opacity: 0.6 }` — 2s ease-in-out infinite | `--animate-pulse-custom` (differs from built-in `animate-pulse` which uses opacity 0.5) |
| `pulseIcon` | `PriceAlertBadge.module.css` | `0%,100% { scale(1); opacity: 1 } 50% { scale(1.1); opacity: 0.8 }` — 2s infinite | `--animate-badge-pulse` |
| `pulse-flame` | `globals.css` | Box-shadow pulse on epic badge | `--animate-pulse-flame` |
| `blink` | `FlashSales.module.css` | `0%,100% { opacity: 1 } 50% { opacity: 0 }` | `--animate-blink` |
| `pop` | `WishlistIndicator.module.css` | Scale-in pop | `--animate-pop` |
| `matrixDrift` | `HeroSection.module.css` | `from { translate(0,0) }` — 60s continuous | `--animate-matrix-drift` |

**⚠️ Tests with CSS module mocks:** 14 test files have `vi.mock('./*.module.css', ...)`. After module removal, these mocks will throw (can't mock nonexistent file). Must remove mock lines alongside module deletion — one commit per file pair (module + its test mock).

**⚠️ Shared CSS modules:** 6 `.module.css` files imported by multiple TSX files. Migration must handle ALL consumers simultaneously:

| Shared Module | Consumers | Lot |
|---------------|-----------|-----|
| `src/app/page.module.css` | `page.tsx`, `search/page.tsx`, `search/SearchResults.tsx`, `wishlist/shared/page.tsx` (4) | Lot 3 |
| `src/app/auth/error/page.module.css` | `auth/error/page.tsx`, `auth/auth-code-error/page.tsx` (2) | Lot 2 |
| `src/app/collections/collections.module.css` | `collections/page.tsx`, `collections/[slug]/page.tsx` (2) | Lot 3 |
| `src/app/playlists/page.module.css` | `playlists/page.tsx` only (1) — has own `page.module.css`; `playlists/[id]/page.tsx` uses separate module | Lot 3 |
| `src/app/bundles/bundles.module.css` | `bundles/page.tsx` only (1) | Lot 3 |
| `src/components/SidebarModal.module.css` | `SidebarModal.tsx` only (1) | Lot 2 |

**⚠️ Dynamic classNames:** 2 files use bracket notation `styles[variant]`:
- `AddToListButton.tsx`: `styles[ variant]` where variant = `'icon' | 'full'`
- `AuthModal.tsx`: `styles[message.type]` where type is dynamic string

Both must be converted with explicit Tailwind class maps instead of dynamic CSS module access.

**⚠️ Conditional `cn()` with CSS modules:** 1 file uses `cn()` with `&&` operators mixing CSS module classes:
- `RatingStars.tsx`: `cn(styles.star, filled && styles.filled)` — boolean logic must be preserved exactly when converting to Tailwind classes.

**⚠️ Template literal conditionals:** 12 files use `` `${styles.x} ${condition ? styles.y : ''}` `` patterns (e.g. `HeartButton.tsx`, `FlashSales.tsx`, `AlertCard.tsx`, `NotificationBell.tsx`, `GameDealRow.tsx`, `WishlistTabs.tsx`, `HeroNavigation.tsx`, `HeroSlide.tsx`). All straightforward string replacement but structure must be kept.

**⚠️ Mixed Tailwind + CSS Module on same element:** `search/page.tsx` uses `container` (Tailwind) + `styles.searchLayout` on same div. Both must be pure Tailwind after migration.

**⚠️ className prop drilling:** `DealsBadge`, `PriceAlertTrigger`, `GameCard` pass `className` between components. After migration, ensure passed classNames are Tailwind-compatible.

#### Lot 1: TRIVIAL (5 files, ~110 lines, near-zero risk)

Files: `loading.module.css`, `@modal/modal.module.css`, `PriceAlertBadge.module.css`, `AddToListButton.module.css`, `Charts.module.css`

Strategy: Direct 1:1 mapping to Tailwind utilities + built-in animations.

| File | Key CSS | Tailwind Replacement |
|------|---------|---------------------|
| `loading.module.css` | `@keyframes spin`, centered container | `animate-spin`, `flex min-h-[50vh] items-center justify-center` |
| `modal.module.css` | 4 lines, modal positioning | Tailwind utilities inline |
| `PriceAlertBadge.module.css` | `@keyframes pulse` | `animate-pulse` built-in |
| `AddToListButton.module.css` | Button styling | Tailwind button utilities |
| `Charts.module.css` | Chart container | Tailwind sizing |

#### Lot 2: MODERATE-low (10 files, ~500 lines)

Files: `AddToListModal`, `AuthModal`, `DealsBadge`, `EndingSoon`, `GameStatsRow`, `HeartButton`, `HistoricalLows`, `NotificationBell`, `PriceAlertTrigger`, `RatingStars`, `SidebarModal`, `ThemeToggle`, `WishlistIndicator`, `WishlistTabs`, `StoreCard`, `out.module.css`, `auth/error/page.module.css`

Strategy: Tailwind utilities for layout. Keep complex `color-mix` gradients as inline `style` or promote to `@utility` if reused.

Pattern for `color-mix` replacement: Tailwind v4 supports opacity modifiers on theme colors: `bg-primary/20` = `color-mix(in srgb, var(--color-primary) 20%, transparent)`. This covers ~90% of `color-mix` usage found.

#### Lot 3: MODERATE-high (11 files, ~400 lines)

Files: `AlertCard`, `FilterSidebar`, `Freebies`, `GameDealRow`, `GameHero`, `StoreComparison`, `StoreFilter`, `app/bundles`, `app/collections`, `app/playlists/page`, `app/playlists/[id]/page`

Strategy: Most layout replaces with Tailwind. Edge cases handled inline:
- `::-webkit-scrollbar` → keep as minimal inline style or drop (browser-native scrollbars are acceptable)
- `::placeholder` → Tailwind `placeholder:` variant
- `accent-color` → inline `style={{ accentColor: 'var(--primary)' }}`
- `:checked + .sibling` → can't express in Tailwind utilities, keep minimal CSS or use React state

#### Lot 4: COMPLEX (5 files, ~800 lines)

Files: `FlashSales`, `HeroSection`, `PriceAlertModal`, `WishlistGrid`, `wishlist/page.module.css`

Strategy: Hybrid approach. Layout → Tailwind. Complex animations/gradients → defined once in `globals.css` `@theme` block as `--animate-*` or `@utility` classes.

**FlashSales:** `@keyframes pulse` glow → `--animate-pulse-glow` in `@theme`. Progress bar with `color-mix` → Tailwind opacity modifiers.

**HeroSection:** 6 `@media` queries for responsive sizing → Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`). Multi-layer gradients → Tailwind `bg-gradient-*` utilities or single `@utility` in globals.css.

**PriceAlertModal:** Multi-layer gradient backgrounds → promote to `@utility` if reused. Checkbox `accent-color` → inline style.

**WishlistGrid:** `backdrop-filter: blur()` on overlays → Tailwind `backdrop-blur-*`. `@keyframes pulse` → `--animate-pulse` built-in.

**wishlist/page.module.css:** 445 lines (largest file). Hero `filter` stack (`blur + brightness + saturate`) → Tailwind `blur-*`, `brightness-*`, `saturate-*` utilities. Gradient overlays → Tailwind `bg-gradient-*`. `clamp()` typography → Tailwind `text-[clamp(...)]` arbitrary values.

#### Lot 5: Final Cleanup

- Remove all `@import './*.module.css'` from TSX files
- Remove all `.module.css` files
- Verify `globals.css` contains all `@keyframes`, `@utility` classes, and `@theme` tokens
- Remove `BaseModal.tsx`, `BaseModal.module.css`, `BaseModal.test.tsx`
- Remove `AnimatedDiv.tsx`
- Run `pnpm lint:fix` + `pnpm build`

### Phase 5: Quality Verification

**Pre-existing QA infrastructure:**
- Visual regression testing: `tests/e2e/visual.spec.ts` with CDP screenshot capture (5 test cases). Snapshots in `visual.spec.ts-snapshots/`. Commands: `test:e2e:visual` and `test:e2e:visual:update`.
- E2E test suite: Playwright (`alerts-crud.spec.ts`, `alerts.spec.ts`, `full-journey.spec.ts`, `visual.spec.ts`)
- Unit tests: 123 test files, 1,076 tests, all passing (7.22s). Clean baseline.
- **Good news:** Zero tests assert on specific CSS module class names. All `className` assertions test custom `className` prop — unaffected by migration.
- **Test mock removal:** 14 test files have `vi.mock('./*.module.css', ...)`. Remove mock lines in same commit as module file deletion. No test logic changes needed — mocks were always stubs returning fake class names, tests don't validate them.

- Screenshot comparison per page: Home, /game/[id], /wishlist, /alerts, /playlists, /collections
- WCAG contrast check on all converted components
- Responsive breakpoint audit (mobile → desktop)
- `pnpm test` — update any className-dependent selectors
- `pnpm build` — verify zero CSS module references remain

## 4. What Does NOT Change

- **Data layer:** Zustand stores, TanStack Query hooks, Server Actions — all untouched
- **Business logic:** Zero changes to any logic files
- **API routes:** Untouched
- **Database schema:** Untouched
- **Tests:** Only selector updates if className changes, not test logic
- **shadcn/ui components:** All 18 components under `src/components/ui/` remain
- **`@base-ui/react`:** Stays (shadcn/ui dependency)
- **`next-themes`:** Stays (handles system detection + localStorage persistence that `light-dark()` alone cannot)
- **`recharts`:** Stays (React 19 compatible, used for price history charts)

## 5. Verification Steps

1. `pnpm test` after each lot — 123 test files, 1,076 tests must stay green
2. Remove `vi.mock('./*.module.css')` lines from 14 test files in same commit as module deletion
3. Visual regression: `pnpm test:e2e:visual:update` to rebaseline after each phase
4. E2E full journey: `pnpm test:e2e` — full-journey.spec.ts, alerts-crud.spec.ts, alerts.spec.ts
5. `pnpm build` — verify zero CSS module references remain in build output
6. Manual smoke test: Home, /game/[id], /wishlist, /alerts, /playlists, /collections, /leaderboard, /bundles, /profile

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| AuthModal/PriceAlertModal do NOT import Dialog* — needs new imports | Confirmed | Medium | Add `Dialog, DialogContent` imports during conversion |
| BaseModal removal deletes 7 tests for focus trap/scroll lock/escape/overlay | Confirmed | Medium | Add equivalent tests on AuthModal and PriceAlertModal post-conversion |
| SidebarModal conflated with BaseModal | Clarified | Low | SidebarModal is separate — only CSS module migrates, component stays |
| `color-mix` pattern loss | Medium | Visual | Tailwind opacity modifiers (`/20`) cover most cases; remaining use inline `style` |
| Scroll animation regression | Low | Visual | No scroll-driven CSS animations used; all animations play on mount |
| Modal focus trap break after BaseModal removal | Low | A11y | shadcn `Dialog` handles focus trap via `@base-ui/react` |
| Responsive break in HeroSection | Medium | Visual | Tailwind responsive breakpoints are proven; test across viewports |
| CSS specificity conflict | Low | Visual | CSS modules isolate; Tailwind utilities are flat — existing shadcn components already use Tailwind without issues |
| Animation jank on HomeHero parallax | Low | Visual | `background-attachment: fixed` is GPU-composited; fallback to static if issues |
| 14 test files mock `.module.css` imports — will fail when module deleted | Confirmed | Medium | Remove mock lines in same commit as module deletion |
| 6 shared modules imported by multiple TSX files — broken if migrated per-file | Confirmed | Medium | Convert all consumers of shared module in same commit |
| Dynamic `styles[variant]` in AddToListButton + AuthModal — broken if CSS module removed before refactor | Confirmed | High | Refactor to explicit Tailwind classMap objects BEFORE module removal |
| 18 unique `@keyframes` need `@theme` registration — missing animations | Confirmed | High | Register ALL keyframes in `globals.css` BEFORE converting consumer files |
| Mixed Tailwind + CSS Module classes on same element — half-migration makes element broken | Confirmed | Medium | Audit all mixed-className elements per file before converting |
| className prop drilling across components (DealsBadge, PriceAlertTrigger, GameCard) | Medium | Low | Tailwind classes pass through — parent sets Tailwind, child receives Tailwind. Works. |

## 6. Pre-Implementation Checklist

Before Phase 1 starts, verify these prerequisites:

- [ ] All 18 `@keyframes` registrations written to `globals.css` `@theme` block
- [ ] Dynamic `styles[variant]` in `AddToListButton.tsx` refactored to Tailwind classMap
- [ ] Dynamic `styles[message.type]` in `AuthModal.tsx` refactored to Tailwind classMap
- [ ] Shared module consumer groups mapped (6 shared modules → batch commits)
- [ ] 14 test mock files identified for paired deletion
- [ ] Mixed className elements audited per file

## 7. Success Criteria

- [ ] `gsap`, `motion`, `tw-animate-css` removed from `package.json`
- [ ] Zero `.module.css` files remain in `src/`
- [ ] `BaseModal.tsx`, `AnimatedDiv.tsx` removed
- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm test` passes
- [ ] Visual parity: all pages render identically to current state
- [ ] Animations work: entrance fade-slide visible, hover lift on cards
- [ ] HomeHero parallax works across Chrome/Firefox/Safari
- [ ] Modals: open/close/focus-trap/backdrop-click all functional
- [ ] Theme toggle: dark/light/system switch works
- [ ] Keyboard navigation unaffected
- [ ] Bundle size reduction verified (JS animation runtime eliminated)
