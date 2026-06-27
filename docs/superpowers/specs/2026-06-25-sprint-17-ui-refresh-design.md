# Sprint 17 — UI Refresh: Game Discovery & Community

**Date:** 2026-06-25
**Version:** v0.8.0
**Status:** Approved

## Product Direction

GameDeals evolves from "deal aggregator" to **game discovery platform with community**. International audience. Core loop: user discovers games → feels compelled to buy → uses affiliate links → site earns commission. Community layer (ratings, public playlists) extends session time and builds moat.

## Design Identity

- **Vibe:** Gamer Premium — dark mode native, game art as hero, accent green (#22c55e), micro-interactions
- **Inspiration:** Steam (game art hero) × Linear (clean tooling)
- **Stack:** Tailwind v4 + shadcn/ui primitives + motion (anims). NO GSAP.

---

## Phase A — Rating System

### Schema

Table `game_ratings`:

```
id          UUID  PK  (default gen_random_uuid())
game_id     text  NOT NULL  (game slug)
user_id     UUID  NOT NULL  (references auth.users)
rating      int   NOT NULL  CHECK (1-5)
created_at  timestamptz    default now()
updated_at  timestamptz    default now()

UNIQUE(game_id, user_id)  — one vote per user per game
INDEX(game_id)            — fast avg lookup
```

### Actions

- **`rateGame(gameId, rating)`** — upsert. If already voted, update.
- **`getGameRating(gameId)`** — returns `{ avg, count, bayesianAvg, userRating }` for logged user. `userRating` = null if not logged.
- **`getAvgRating(gameId)`** — lightweight wrapper for cards: returns `{ avg, bayesianAvg, count }`.

### Bayesian Average

Calculated as a **VIEW** in DB. No trigger, no cron, no extra table.

```sql
CREATE VIEW game_ratings_agg AS
SELECT
  game_id,
  COUNT(*) AS count,
  AVG(rating)::numeric(3,2) AS avg,
  (AVG(rating) * COUNT(*) + (SELECT AVG(rating) FROM game_ratings) * 7) / (COUNT(*) + 7) AS bayesian_avg
FROM game_ratings
GROUP BY game_id;
```

`C = 7` confidence constant. 1-vote games are pulled toward global average. 100-vote games ≈ real average.

### Display Behavior

| User state | Sees | Can rate? |
|-----------|------|-----------|
| Anonymous | `bayesian_avg` from Supabase + local preview | Yes (localStorage) |
| Logged | `bayesian_avg` + personal vote | Yes (Supabase upsert) |

Anonymous preview is Phase 1 only. **Sync from localStorage to Supabase on login is Phase 2** — YAGNI now.

Gamification (XP, badges) is **not coupled** to ratings. YAGNI.

### Component: `RatingStars`

- Props: `rating: number, count?: number, interactive: boolean, size: 'sm' | 'md' | 'lg'`
- Modes: `interactive` (clickable, hover state) vs `display` (read-only, fractional fill)
- States: 5 stars, hover highlight, selected highlight, partial fill for bayesian avg (e.g., 3.5★)
- Accessibility: `role="radiogroup"` with `aria-label`. Keyboard arrow keys for interactive mode.
- Animation: `transition: color 0.2s` — CSS only, no JS

---

## Phase B — GameCard Refactor

### Layout

```
┌──────────────────────┐
│  Hero Image           │  ← object-fit: cover
│                       │  (fallback: hash-based gradient)
│  ┌────────────────┐   │
│  │ Título         │   │  ← overlay: linear-gradient(transparent → black 80%)
│  │ ★★★★☆ 4.2     │   │
│  │ 128 wishlisted │   │
│  │ -65%  R$ 20,37 │   │
│  └────────────────┘   │
└──────────────────────┘
```

### Changes

| File | Action |
|------|--------|
| `src/components/game/GameCard.tsx` | Refactor: shadcn Card + Tailwind. Hero image, overlay, rating, badge |
| `src/components/GameCard.module.css` | **Delete** — migrate to Tailwind. Verify no test imports it |
| `src/components/GameCard.test.tsx` | Update — test new layout, rating rendering, badge conditional |
| `src/components/DiscountBadge.tsx` | **New** — -X% pill, green (#22c55e), conditional if savings > 0 |

### Data Flow

```tsx
interface GameCardProps {
  game: {
    slug: string
    title: string
    thumb: string
    salePrice: number
    normalPrice: number
    savings: number
    storeID: string
  }
}
```

Rating fetched via `getAvgRating` inside the card (TanStack Query). Wishlist count aggregated from `wishlist` table.

### Image Rules

- Use CheapShark thumb with `object-fit: cover`
- If thumb === `default.jpg` (Steam no-screenshot placeholder), fallback to CSS gradient based on game title hash
- No placeholder image asset needed — pure CSS

---

## Phase C — Home Page Layout

```
┌──────────────────────────────────────────────┐
│  HERO                                         │
│  ┌────────────────────────────────────────┐   │
│  │  [Game Art]  RPG Moon                  │   │
│  │  ★★★★☆  4.2                           │   │
│  │  R$ 49,90                              │   │
│  │  [Buy Now]                             │   │
│  └────────────────────────────────────────┘   │
│                                               │
│  HOT DEALS NOW  →                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │Card│ │Card│ │Card│ │Card│ │Card│  scroll   │
│  │  1 │ │  2 │ │  3 │ │  4 │ │  5 │  snap     │
│  └────┘ └────┘ └────┘ └────┘ └────┘         │
│                                               │
│  DISCOVERY GRID                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Top Deals │ │Under $10 │ │Free Games│      │
│  │ 10 jogos │ │ 10 jogos │ │ 10 jogos │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                               │
│  COMMUNITY LISTS                               │
│  ┌──────────────────────────────────────┐     │
│  │ "Melhores RPGs"  por João            │     │
│  │ 12 jogos · 45 saves · ★ 4.5         │     │
│  ├──────────────────────────────────────┤     │
│  │ "Jogos coop"  por Maria              │     │
│  │ 8 jogos · 32 saves · ★ 4.2          │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  TOOLBAR (fixed bottom or sidebar)             │
│  [Search] [Store ▼] [Price min] [Price max]   │
└──────────────────────────────────────────────┘
```

### Hero Section

- Source: top deal from CheapShark, filtered: `thumb !== 'default.jpg' AND dealRating > 0`
- Query: `getDealsAction({ sortBy: 'dealRating', limit: 1 })`
- Fallback: if no deal matches, **section does not render** — page is not broken
- Editorial override possibility: none in Phase 1. YAGNI.
- Transition: `motion` fade-in + translateY on mount

### Hot Deals Row

- Source: `getDealsAction({ sortBy: 'dealRating', limit: 10 })`
- Scroll: `overflow-x: auto` + `scroll-snap-type: x mandatory` + `scroll-behavior: smooth`
- Cards: same GameCard component (no compact variant needed)
- Click: navigates to `/game/[slug]`

### Discovery Grid

Three sections, each = one SQL query, no schema:

| Section | Query | Limit |
|---------|-------|-------|
| Top Deals | `ORDER BY dealRating DESC` | 10 |
| Under $10 | `WHERE salePrice < 10 ORDER BY dealRating DESC` | 10 |
| Free Games | `WHERE salePrice = 0 ORDER BY dealRating DESC` | 10 |

Each rendered as compact deal row: title, price, discount badge, rating.

### Filter Toolbar

- **Store filter:** dropdown of stores available in current data. Query distinct stores from CheapShark, not hardcoded.
- **Price range:** `<input type="number">` for min + max.
- **Search:** text input. Filters are client-side over current data. Full search is navbar's job.
- **State:** Toolbar is Client Component. Filters control TanStack Query params.
- **Architecture:** Filters → `useState` + `useQuery` with debounce. No URL params — home page doesn't need SEO for filter state.
- **Transition:** `<AnimatePresence>` from motion for toolbar open/close (mobile).

### New Components (Phase C)

| Component | Type | Description |
|-----------|------|-------------|
| `HeroSection` | Server | Renders top deal as banner |
| `HotDealsRow` | Server | Horizontal scroll of GameCards |
| `DiscoveryGrid` | Server | 3-column grid of deal collections |
| `FilterToolbar` | Client | Store, price, search filters |
| `DealRow` | Server | Compact line item for discovery sections |

---

## Phase D — Community Lists

### Implementation

Query top 5 public playlists by save count:

```sql
SELECT
  p.*,
  COUNT(pg.game_id) AS game_count
FROM playlists p
LEFT JOIN playlist_games pg ON p.id = pg.playlist_id
WHERE p.is_public = true
GROUP BY p.id
ORDER BY p.saves DESC
LIMIT 5
```

Zero schema changes — data already exists (`playlists`, `playlist_games`).

### Component: `CommunityListsSection`

- Cards showing: playlist name, author name, game count, saves count, avg rating of games
- Click → `/playlist/[id]` (existing route)
- Fixed section on home page (not filterable — YAGNI)
- Grid: 3 columns desktop, 2 tablet, 1 mobile

---

## Phase E — Polish & Micro-interactions

### What we DO

| Element | Technique |
|---------|-----------|
| Hero entrance | `motion` fade-in + translateY |
| Hot deals scroll | CSS `scroll-snap` + `scroll-behavior: smooth` |
| GameCard hover | `transform: scale(1.02)` + enhanced shadow — CSS `transition` |
| Rating stars fill | `transition: color 0.2s` |
| Toolbar slide | `<AnimatePresence>` from motion |
| Theme toggle | `transition: background-color 0.3s, color 0.3s` on global tokens |
| Card list loading | Skeleton via Tailwind `animate-pulse` |

### What we DON'T

- ~~GSAP~~ — zero value for these transitions
- ~~Scroll-triggered parallax~~ — overkill
- ~~Page transitions~~ — Next.js App Router already instant
- ~~Animated counters~~ — extra JS, no UX gain

---

## Non-Functional

### Performance

- Toolbar is client-side filters + TanStack Query. Home page sections are Server Components where possible
- Hot deals row: lazy load images via `loading="lazy"`
- Discovery sections: each query is independent, can parallelize
- No GSAP → smaller bundle

### Accessibility

- RatingStars: `role="radiogroup"` with `aria-label` "Rating: X of 5"
- Interactive stars: keyboard navigable (arrow keys)
- Hero image: `alt` text with game title
- Color contrast: WCAG AA on all text (verified in Phase E)

### Error States

| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| Hero | Skeleton banner | Section hidden | Section hidden |
| HotDealsRow | Skeleton cards | "No hot deals now" | "Could not load" |
| DiscoveryGrid | Per-section skeleton | "No deals found" | per-section fallback |
| RatingStars | Skeleton stars | 0 stars | "Unavailable" |
| CommunityLists | Skeleton cards | "No lists yet" | "Could not load" |

### Testing

- Phase A: `RatingStars.test.tsx`, ratings actions unit tests, DB migration test
- Phase B: `GameCard.test.tsx` updated — new layout, badge conditional, rating display
- Phase C: no new tests — visual only. Smoke test in Phase E
- Phase D: no new tests — hits existing playlist routes
- Phase E: visual audit (manual)

All existing tests (~989) must pass.

---

## Files Changed

| File | Phase | Action |
|------|-------|--------|
| `src/db/schema/ratings.ts` | A | New |
| `src/db/schema/index.ts` | A | Export ratings |
| `src/db/migrations/0014_ratings/` | A | New |
| `src/actions/ratings.ts` | A | New |
| `src/hooks/useGameRating.ts` | A | New |
| `src/components/RatingStars.tsx` | A | New |
| `src/components/RatingStars.test.tsx` | A | New |
| `src/components/game/GameCard.tsx` | B | Refactor |
| `src/components/GameCard.module.css` | B | Delete |
| `src/components/GameCard.test.tsx` | B | Update |
| `src/components/DiscountBadge.tsx` | B | New |
| `src/app/page.tsx` | C | New layout |
| `src/components/HeroSection.tsx` | C | New |
| `src/components/HotDealsRow.tsx` | C | New |
| `src/components/DiscoveryGrid.tsx` | C | New |
| `src/components/DealRow.tsx` | C | New |
| `src/components/FilterToolbar.tsx` | C | New |
| `src/components/CommunityListsSection.tsx` | D | New |
| `src/app/globals.css` | E | Transition tokens |
| Various `*.module.css` | E | Remove hardcoded colors |

## Non-Changes

- Auth flow — untouched
- Alerts, wishlist, playlists CRUD — untouched
- Collections (editorial) — untouched
- Price history — untouched
- PWA / service worker — untouched
- Navbar — untouched (toggle already exists)

## Estimates

| Phase | Items | Est. |
|-------|-------|------|
| **A** | DB migration + ratings schema + actions + hooks + RatingStars | ~3h |
| **B** | GameCard refactor (hero layout, rating stars, freshness) | ~4h |
| **C** | Home page new layout (hero, deals grid, discovery, toolbar) | ~6h |
| **D** | Community lists section on home page | ~2h |
| **E** | Polish — motion + CSS transitions, responsive tweaks, dark mode fix | ~3h |
| **Total** | | ~18h |

## Definition of Done

- [ ] All phases A-E complete
- [ ] All existing tests pass
- [ ] New tests for ratings, GameCard, actions
- [ ] CI green (lint, typecheck, build, tests, SonarCloud, Semgrep)
- [ ] Security headers intact (from Sprint 16)
- [ ] Visual: hero, hot deals, discovery, toolbar, community lists all render
- [ ] Dark mode: no hardcoded colors in touched CSS files
