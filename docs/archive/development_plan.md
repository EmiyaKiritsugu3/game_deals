# GameDeals — Development Plan 2026

## Legend
`[dep: X]` = depends on X being complete
`~30m` = effort estimate

---

## PHASE 0 — Foundation ✅ (COMPLETE)
- [x] pnpm + Biome + Tailwind v4 + Drizzle ORM + Vitest
- [x] 12 ADRs validated

---

## PHASE 1 — Database + Auth (2-3h)
**Goal**: Supabase connected, user logs in, SSR session works.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 1.1 | Configure Supabase project (dashboard) + get URL/keys | 15m | — |
| 1.2 | `DATABASE_URL` + `SUPABASE_*` in `.env.local` | 5m | 1.1 |
| 1.3 | Run `pnpm db:generate` + `pnpm db:migrate` (create tables) | 10m | 1.2 |
| 1.4 | Finalize `src/utils/supabase/server.ts` + `middleware.ts` (already created) | 30m | 1.2 |
| 1.5 | AuthModal (Google/Discord/Steam login) functional | 1h | 1.4 |
| 1.6 | AuthStore (Zustand) sync with SSR session | 30m | 1.5 |
| 1.7 | Test: login → middleware protects routes → logout | 15m | 1.6 |

**Deliverable**: User logs in with Google/Discord, session persists in SSR, protected routes work.

---

## PHASE 2 — Data Layer (3-4h)
**Goal**: CheapShark API integrated via Server Actions + TanStack Query, data in database.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 2.1 | `src/actions/deals.ts` — Server Actions for CheapShark with `use cache` | 45m | 1.3 |
| 2.2 | `src/hooks/useDeals.ts` — TanStack Query hooks (home, search, game detail) | 45m | 2.1 |
| 2.3 | `src/actions/prices.ts` — Price ingestion into database (cron job) | 1h | 1.3, 2.1 |
| 2.4 | Fallback deals (`src/data/fallbackDeals.ts`) — compile-time data | 30m | — |
| 2.5 | Test: home page loads deals, fallback works, TanStack Query caches | 30m | 2.2, 2.4 |
| 2.6 | Prepare Vercel cron job for price ingestion (cron 4h) | 30m | 2.3 |

**Deliverable**: Home page shows real deals from CheapShark with cache and fallback.

---

## PHASE 3 — Affiliate + Cloaking (2h)
**Goal**: Affiliate links working with `/out` route + tracking.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 3.1 | Map `storeId → affiliate network` in database (seed) | 30m | 1.3 |
| 3.2 | `src/app/out/[storeId]/[gameSlug]/route.ts` — Edge redirect + click log | 45m | 1.3 |
| 3.3 | `AffiliateLink` in frontend (DealRow uses /out link) | 30m | 3.2 |
| 3.4 | LGPD cookie banner + consent | 30m | — |

**Deliverable**: Click on deal → redirect `/out/steam/game-123` → logs click → redirect to Steam with tracking.

---

## PHASE 4 — Search (2-3h)
**Goal**: Navbar search functional with Typesense Cloud.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 4.1 | Create Typesense Cloud cluster (free tier) + API key | 15m | — |
| 4.2 | `src/lib/typesense.ts` — client + schema + sync function | 45m | 4.1 |
| 4.3 | `src/actions/search.ts` — Server Actions wrapper | 30m | 4.2 |
| 4.4 | Navbar search dropdown with TanStack Query + debounce | 1h | 4.3 |
| 4.5 | Cron: daily reindex of updated games | 30m | 4.2 |

**Deliverable**: Type in Navbar → results in <100ms with typo tolerance.

---

## PHASE 5 — Price History + TimescaleDB (3h)
**Goal**: Price history charts with TimescaleDB.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 5.1 | Enable TimescaleDB extension in Supabase | 10m | — |
| 5.2 | Migrate `price_history` to TimescaleDB hypertable | 30m | 1.3 |
| 5.3 | Continuous aggregate (hourly/daily rollup) | 45m | 5.2 |
| 5.4 | `src/hooks/usePriceHistory.ts` — TanStack Query hook | 30m | 5.2 |
| 5.5 | Recharts chart in game detail modal | 1h | 5.4 |

**Deliverable**: Game detail shows price history chart with daily rollups.

---

## PHASE 6 — User Features (4-5h)
**Goal**: Wishlist, playlists, price alerts, gamification.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 6.1 | Wishlist — sync Zustand local → Supabase on login | 1h | 1.6 |
| 6.2 | Playlists — CRUD (create, add game, share, public/private) | 1.5h | 1.6 |
| 6.3 | Price alerts — create alert, check via cron, notify | 1.5h | 2.3, 1.6 |
| 6.4 | Gamification — XP tracking + badges (purchases, reviews, login streak) | 1h | 1.6 |

**Deliverable**: Logged-in user has wishlist, playlists, price alerts, XP and badges.

---

## PHASE 7 — Polish + SEO (3h)
**Goal**: Performance, SEO, analytics, deploy.

| # | Task | Est. | Dep. |
|---|------|------|------|
| 7.1 | SEO metadata (opengraph, structured data, sitemap) | 45m | — |
| 7.2 | PPR (Partial Prerendering) on main pages | 30m | — |
| 7.3 | ISR on-demand for deals page (revalidateTag) | 30m | 2.1 |
| 7.4 | Vercel Analytics + Speed Insights configured (already installed) | 15m | — |
| 7.5 | Tailwind v4 migration of main components (Phase 1-2 of ADR-011) | 1h | — |

**Deliverable**: Lighthouse 90+ on mobile, sitemap.xml, OG images.

---

## PHASE 8 — Scale + Exit Strategy (when needed)
- [ ] Migrate Typesense → pgvector + hybrid FTS
- [ ] OpenNext → Fly.io / Railway (exit Vercel)
- [ ] Distributed cache (Redis/KV)
- [ ] Image CDN (Cloudflare Images)

---

## Recommended Order

```
PHASE 0 → PHASE 1 → PHASE 2 → PHASE 3 → PHASE 4 → PHASE 5 → PHASE 6 → PHASE 7
```

Each phase is **standalone** after the previous ones. You can stop at any phase and have something functional.

## Next: What to do now?
"PHASE 1 — Database + Auth" — is the foundation of everything. Without it, nothing saves to the database, nobody logs in.
