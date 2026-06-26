# UI Stack Modernization — Design Spec

**Date:** 2026-06-26
**Branch:** feat/sprint-17-ui-refresh
**Status:** Approved

## 1. Objective

Eliminate CSS modules, remove dead/unnecessary dependencies, and consolidate all styling into Tailwind CSS v4 + CSS custom properties. Target: fewer files, smaller bundle, zero JS animation runtime, single source of truth for theme.

## 2. Stack Comparison

| Layer | Current | Target | Rationale |
|-------|---------|--------|-----------|
| Styling | 46 CSS modules (2931 lines) + Tailwind v4 | Tailwind v4 only + CSS custom properties | Modules duplicate what Tailwind utilities already do |
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

- JS animation runtime: ~12KB → 0KB
- CSS file count: 48 → 1 (`globals.css`)
- CSS total lines: ~3000 → ~800-1200

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
   - Uses `BaseModal` + already imports `Dialog*` components

2. **`src/components/PriceAlertModal.tsx`** (lines 103-167)
   - Wraps price alert form
   - Uses `BaseModal` + already imports `Dialog*` components

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

BaseModal overlay uses `color-mix(in srgb, var(--background) 70%, transparent)` with `backdrop-filter: blur(4px)`. shadcn `DialogOverlay` defaults to `bg-black/80`. May need to customize overlay style via className to match.

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

**Current:** `useScroll` + `useTransform` drives `y: bgY` (0% → 30% parallax) on background image.

**Replacement:** `background-attachment: fixed` on the background image container. This is native CSS, universally supported, and produces near-identical parallax effect.

```css
/* Before: motion.div with animated y transform */
/* After: */
.hero-background {
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
}
```

**Current:** `motion.div` with `initial/opacity+y → animate` for content card and game image.

**Replacement:** `animate-fade-slide-in` + staggered delays:

```tsx
// Content card
<div className="animate-fade-slide-in">
// Game image  
<div className="animate-fade-slide-in" style={{ animationDelay: '0.15s' }}>
```

**Verification:**
- HomeHero renders without motion dependency
- Parallax effect works on scroll (Chrome, Firefox, Safari)
- Entrance animations play on page load
- No visual regression vs current

### Phase 4: CSS Modules → Tailwind

Ordered by risk/complexity. Each lot is independently committable and verifiable.

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

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| `color-mix` pattern loss | Medium | Visual | Tailwind opacity modifiers (`/20`) cover most cases; remaining use inline `style` |
| Scroll animation regression | Low | Visual | No scroll-driven CSS animations used; all animations play on mount |
| Modal focus trap break | Low | A11y | shadcn `Dialog` handles focus trap via `@base-ui/react` |
| Responsive break in HeroSection | Medium | Visual | Tailwind responsive breakpoints are proven; test across viewports |
| CSS specificity conflict | Low | Visual | CSS modules isolate; Tailwind utilities are flat — existing shadcn components already use Tailwind without issues |
| Animation jank on HomeHero parallax | Low | Visual | `background-attachment: fixed` is GPU-composited; fallback to static if issues |

## 6. Success Criteria

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
