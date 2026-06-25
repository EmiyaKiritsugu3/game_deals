# Sprint 17 — UI Refresh: Game Discovery & Community

**Date:** 2026-06-25
**Version:** v0.8.0
**Status:** Draft

## Product Direction

GameDeals evolves from "deal aggregator" to **game discovery platform with community**. International audience. Core loop: user discovers games → feels compelled to buy → uses affiliate links → site earns commission. Community layer (ratings, public playlists) extends session time and builds moat.

## Design Identity

- **Vibe:** Gamer Premium — dark mode native, game art as hero, accent green (#22c55e), micro-interactions
- **Inspiration:** Steam (game art hero) × Linear (clean tooling)
- **Stack:** Tailwind v4 + shadcn/ui primitives + motion (anims) + GSAP (scroll/enter anims)

## Architecture Changes

### Home Page — New Layout

```
Hero (game art bg + deal)       ← getFeaturedDeal()
├── Title, price, % badge
├── "Buy Now" → /out/[storeId]/[slug]
└── "Read Reviews" → /game/[id]

Hot Deals Now (horizontal scroll)  ← getDealsAction(sortBy=dealRating)
└── GameCard (shadcn Card + Badge)

Discovery Grid                     ← collections + popular playlists
├── Collection cards (top deals, under $10, free games)
├── "Community Lists" (public playlists preview)
└── DealRow (compact, data-dense)

Toolbar                            ← FilterSidebar
├── Search, store filter, price range
└── "X users watching this deal"
```

### GameCard — Refactor

Current: small thumb + title + price + store badge. New:

- **Hero section:** game screenshot (thumb from CheapShark, larger), overlay with title + rating stars (if any)
- **Price section:** current price, % off, original price strikethrough, "X hr ago" freshness badge
- **Footer:** store icon, affiliate CTA "Buy now", heart (wishlist)

### Rating System — Phase 1 MVP

- Schema: `game_ratings` table (game_id, user_id, rating 1-5, created_at)
- Unauthenticated: localStorage (anonymous)
- Authenticated: Supabase upsert (one rating per user per game)
- Display: star component in GameCard + game detail page
- Aggregate: avg + count on game

### Community Listings — Phase 1

- Public playlists already exist (public/private toggle)
- New: "Discover Lists" section on home page showing N most-reacted public playlists
- Playlist cards: name, game count, author avatar, "X saves"

### Tech Changes

| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace sections with new layout (hero, deals grid, discovery, toolbar) |
| `src/components/game/GameCard.tsx` | Refactor: hero image layout, rating stars, price freshness badge |
| `src/components/GameCard.module.css` | Delete (migrate to shadcn Card + Tailwind). **Verify test imports first.** |
| `src/components/ui/` | Already has card, badge, button, dialog, etc |
| `src/db/schema/ratings.ts` | New: game_ratings table + drizzle schema |
| `src/actions/ratings.ts` | New: rateGame, getGameRating, getAvgRating |
| `src/hooks/useGameRating.ts` | New: TanStack Query hook for ratings |
| `src/components/RatingStars.tsx` | New: star component (interactive + display) |
| `src/db/migrations/0014_ratings` | New migration |

### Non-Changes (what stays)

- Auth flow untouched
- Alerts, wishlist, playlists (CRUD) untouched
- Collections (editorial) untouched — discovery section just queries existing data
- Price history charts untouched
- PWA/service worker untouched
- All existing tests untouched

## Test Strategy

- New tests for: RatingStars, GameCard (refactored), ratings actions, ratings DB queries
- Existing 989 tests must still pass
- No E2E changes needed

## Phases & Estimates

| Phase | Items | Est. |
|-------|-------|------|
| **A** | DB migration + ratings schema + actions + hooks | ~3h |
| **B** | GameCard refactor (hero layout, rating stars, freshness) | ~4h |
| **C** | Home page new layout (hero, deals grid, discovery, toolbar) | ~6h |
| **D** | Community lists section on home page | ~2h |
| **E** | Polish — motion/GSAP micro-interactions, responsive tweaks | ~3h |
| **Total** | | ~18h (3-4 days) |

## Definition of Done

- [ ] All phases A-E complete
- [ ] 989+ existing tests pass
- [ ] New tests for ratings, GameCard, home page sections
- [ ] CI green (quality, e2e, SonarCloud, Semgrep, GitGuardian)
- [ ] Security headers intact (from Sprint 16)
