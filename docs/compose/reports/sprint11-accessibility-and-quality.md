---
feature: sprint11-accessibility-and-quality
status: delivered
specs: []
plans:
  - .mimocode/plans/1781964494503-gentle-sailor.md
branch: feat/sprint11-polish
commits: (pending)
---

# Sprint 11 — Accessibility & Quality Fixes — Final Report

## What Was Built

Sprint 11 delivered 6 accessibility and quality fixes across the GameDeals codebase. The original plan was based on stale PRD data — after codebase audit, 12 of 19 items were already implemented (PWA, theme toggle, AlertCard extraction, drizzle stubs, sanitizeTitle fix, lint-staged fix, BaseModal a11y). The revised scope focused on 7 confirmed valid items: Discord button icon fix, aria-live regions, pnpm audit in CI, UserMenu a11y restructuring, AlertsGrid opacity fix, GameBody redundant field removal, and WishlistGrid heart button verification.

## Architecture

### Changes Made

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/AuthModal.tsx` | Replaced `siGithub` with `siDiscord` from simple-icons | Discord button was rendering GitHub icon |
| `src/components/NotificationBell.tsx` | Added `aria-live="polite"` to wrapper div | Dynamic notification count invisible to screen readers |
| `src/components/WishlistIndicator.tsx` | Added `aria-live="polite"` to Link | Dynamic wishlist count invisible to screen readers |
| `.github/workflows/ci.yml` | Added `pnpm audit --audit-level=high` step | No dependency vulnerability scanning in CI |
| `src/components/navbar/UserMenu.tsx` | Restructured: button no longer wraps Link elements | Invalid HTML: `<button>` containing `<Link>` |
| `src/components/Navbar.module.css` | Added `.userMenuWrapper` class, removed `position: relative` from `.userMenu` | Support new DOM structure |
| `src/components/wishlist/AlertsGrid.tsx` | Removed inline `style={{ color: '...' }}` from Bell icon | Inline opacity compounded with CSS opacity |
| `src/components/wishlist/AlertsGrid.module.css` | Updated `.emptyIcon` to use alpha channel | Consistent opacity approach |
| `src/components/game/GameBody.tsx` | Removed redundant `bestCurrentPrice` from ViewModel interface | Same value duplicated at top-level and in `stats` |
| `src/app/game/[id]/page.tsx` | Removed `bestCurrentPrice` from viewModel object | Matches updated interface |
| `src/app/@modal/(.)game/[id]/page.tsx` | Removed `bestCurrentPrice` from viewModel object | Matches updated interface |

### Design Decisions

- **UserMenu restructure**: Moved dropdown outside button to sibling position. Button now has `aria-expanded` and `aria-haspopup` for proper A11y semantics. Wrapper div handles click-outside detection.
- **AlertsGrid opacity**: Replaced separate `opacity: 0.5` with `color: hsl(... / 0.3)` alpha channel approach. Avoids opacity compounding (inline + CSS).
- **GameBody field removal**: `bestCurrentPrice` was identical at both ViewModel top-level and `stats.bestCurrentPrice`. Callers passed the same value to both. Removed top-level, kept in stats.
- **WishlistGrid heart button**: Absolute positioning is intentional for image overlay pattern (standard UI like Instagram). No change needed.

## Usage

No user-facing changes. All fixes are internal quality improvements:
- Discord login button now shows correct Discord icon
- Screen readers announce notification and wishlist count changes
- CI now scans for dependency vulnerabilities
- User menu dropdown is keyboard-navigable and screen-reader accessible

## Verification

```
biome check .          → 0 errors ✅
tsc --noEmit            → 0 errors ✅
pnpm test -- --run      → 901 tests passed ✅
pnpm test:coverage      → 82.35% lines (threshold: 82%) ✅
pnpm knip               → only pre-existing hints ✅
```

## Journey Log

- [lesson] PRD was 3+ months stale — 12/19 items already done. Always audit codebase before planning sprints.
- [lesson] Cubic review items referenced wrong file paths (e.g., `src/components/UserMenu.tsx` vs actual `src/components/navbar/UserMenu.tsx`). Verify file paths before planning fixes.
- [pivot] Original plan was 5-7 days (PWA + theme + quick wins). After audit, scope shrank to 2 days (7 items).
- [dead end] WishlistGrid heart button absolute positioning — checked but no change needed. Standard overlay pattern is intentional.
