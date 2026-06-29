# Sprint: Port Deeply-Coupled DEALFORGE Components

## Objective
Port the remaining DEALFORGE components that depend on Zustand stores (compare, wishlist) and other hooks. These were deferred from PRs #66-#68 because they need store integration, not just copy-paste.

## Components to Port (Priority Order)

### P0 — Core Shopping Experience
1. **deal-card** — The most important component. Features: discount tier badges, verified store badges, wishlist heart, compare checkbox, hover overlay with quick-stats, "N stores" cross-store badge, sheen sweep, conic-border, last-checked timestamp. **Key adaptation**: wishlist store uses `.toggle(gameID)` not `.toggle(deal)`. Compare store uses `.toggle(deal)` with `DealWithStore` objects.
2. **deal-grid** — Renders list of DealCards with skeletons, empty/error states, staggered fade-in, density toggle, smart filter integration. References DealCard import.

### P1 — Interactive Overlays
3. **game-detail-dialog** — Full detail dialog with: large cover, cheapest-ever badge, cross-store comparison sorted cheapest-first with BEST badge, price sparkline, verified store badges, wishlist CTA, affiliate redirect. **Depends on**: `use-game-data` hook (TanStack Query), `price-sparkline`, `deal-cta`.
4. **compare-tray** — Floating glass tray with 3-slot comparison, side-by-side modal with 7 comparison rows (Price, Retail, Savings, Deal rating, Metacritic, Store, Released). **Depends on**: compare store (already ported), wishlist store.
5. **cookie-consent** — LGPD/GDPR-compliant banner with preferences, localStorage persistence. Self-contained module.

### P2 — Auth & Navigation
6. **auth-dialog** — Premium passwordless auth (magic link + social). **Critical adaptation**: replace simulated auth with Supabase SSR. Keep only the visual (glass panels, OTP input, social buttons).
7. **site-header** — Glass nav with scroll-awareness, primary/secondary nav split, search, theme toggle, auth trigger, wishlist badge. **Depends on**: auth-trigger, wishlist store.
8. **site-footer** — 4-column layout, legal links, affiliate disclosure, status indicator (API health ping).

### P3 — Command Palette
9. **command-palette** — Cmd+K fuzzy search with command mode (> prefix). **Depends on**: cmdk (already installed), server search.

## Store Integration Pattern
```
// In wishlistStore.ts (already has aliases):
.toggle(gameID)      ✅ exists
.has(gameID)         ✅ exists
.addRecentlyViewed() ✅ exists (stub)
.wishlist            ✅ exists (as string[])

// In compare store (already ported):
.toggle(deal)        ✅ exists
.remove(dealID)      ✅ exists
.has(dealID)         ✅ exists
```

## Component Adaptation Checklist (per component)
1. Copy from backup: `/tmp/game-deals-new-ui-backup/.../src/components/game/X.tsx`
2. Fix imports: `@/lib/types` → `@/lib/deal-utils`
3. Fix `store.logoUrl` → `` `https://www.cheapshark.com${store.images.logo}` ``
4. Fix `Button asChild` → styled `<a>` or `<button>`
5. Fix `toggle(dealObject)` → `toggle(deal.dealID)` for wishlist
6. Remove props not supported by base-ui Button
7. Build → fix loop

## Backstop
- If a component requires >3 adaptation rounds, skip it and document why
- Focus on P0-P1 first, P2-P3 if time permits
- `pnpm build` must pass before commit
- `pnpm test` must pass before push
