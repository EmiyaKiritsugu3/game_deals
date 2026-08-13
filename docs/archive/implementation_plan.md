# Implementation Plan — GameDeals (2026)

Implementation plan based on approved ADRs, prioritized by ROI and 2026 market validation.

---

## Phase 0 — Foundation (Week 1)
**Stack**: pnpm, Biome, Tailwind v4, Drizzle schema

| Task | ADR | Effort | Depends on |
|--------|-----|---------|------------|
| pnpm migration (`pnpm import`) | ADR-012 | 10 min | — |
| Biome init (`npx biome init`) | ADR-012 | 15 min | — |
| Tailwind v4 install + `@theme` tokens | ADR-011 | 1h | — |
| Drizzle schema (games, stores, affiliates, users) | ADR-001, ADR-004 | 2h | — |
| @supabase/server init | ADR-004 | 30 min | — |
| Vitest + Playwright setup | ADR-012 | 30 min | — |
| GitHub Actions CI workflow | ADR-005 | 30 min | — |

**Result**: Project running pnpm + Biome + Tailwind v4 + Drizzle + tests.


---

## Phase 1 — Core Data (Weeks 2-3)
**Stack**: Server Actions, TanStack Query, Typesense Cloud

| Task | ADR | Effort |
|------|-----|--------|
| Deals API (CheapShark + simulated keyshops) | ADR-002 | 4h |
| TanStack Query v5 migration (SWR → RQ) | ADR-003 | 4h |
| Server Actions setup (deals, games, search) | ADR-003 | 2h |
| Typesense Cloud setup + indexing | ADR-010 | 2h |
| Navbar search (Typesense instant search) | ADR-010 | 3h |
| Home page: Historical Lows + Ending Soon | ADR-008 | 4h |
| Game detail page + Sidebar Modal | ADR-008 | 4h |

---

## Phase 2 — Auth & User (Weeks 3-4)
**Stack**: Supabase Auth, @supabase/server, Drizzle

| Task | ADR | Effort |
|--------|-----|---------|
| Google + Discord + Steam OAuth | ADR-004 | 2h |
| SSR middleware (session refresh) | ADR-004 | 1h |
| User profiles (username, avatar, settings) | ADR-004 | 2h |
| Wishlist (CRUD + Zustand persist + sync) | ADR-003, ADR-008 | 3h |
| Price alerts (CRUD + threshold check) | ADR-009 | 3h |

---

## Phase 3 — Monetization (Weeks 4-5)
**Stack**: `/out` route, affiliate tables, analytics

| Task | ADR | Effort |
|--------|-----|---------|
| `/out/[storeId]/[gameSlug]` route | ADR-006 | 1h |
| Affiliate mapping table + CRUD | ADR-006 | 1h |
| Click logging (affiliate_clicks table) | ADR-006 | 1h |
| LGPD cookie banner + consent | ADR-006 | 2h |

---

## Phase 4 — Social & Gamification (Weeks 5-6)
**Stack**: Supabase Realtime, Badge engine

| Task | ADR | Effort |
|--------|-----|---------|
| Playlists (CRUD + share + slug) | ADR-007 | 3h |
| Badge engine (check + unlock + notification) | ADR-007 | 4h |
| XP system (earn + level + profile display) | ADR-007 | 3h |
| Reviews/ratings (CRUD + RLS) | ADR-007 | 2h |
| Realtime subscriptions (badge unlock, notifs) | ADR-007 | 2h |

---

## Phase 5 — Infrastructure (Weeks 6-7)

| Task | ADR | Effort |
|--------|-----|---------|
| Price history cron (TimescaleDB ingestion) | ADR-009 | 2h |
| Price charts (Recharts + Server Actions) | ADR-009 | 3h |
| Search sync cron | ADR-010 | 1h |
| Vercel deploy + domain + SSL | ADR-005 | 1h |
| Analytics + Speed Insights | ADR-005 | 30 min |

---

## Phase 6 — Scale & Polish (Weeks 8+)

| Task | Priority |
|--------|------------|
| Supabase pgvector + FTS hybrid search | High (reduces cost) |
| Semantic search ("games like..." → embeddings) | Medium |
| Twitter/Reddit embeds + social sharing | Medium |
| PWA + offline mode | Low |
| OpenNext ARM migration | Low |

---

## Final Directory Structure

```
src/
├── actions/          # Server Actions (deals, search, auth, admin)
├── app/              # App Router (pages, layouts, api, out)
│   ├── (main)/       # Authenticated
│   ├── (public)/     # Landing, about, legal
│   ├── out/          # Affiliate cloaking
│   ├── api/          # API routes
│   ├── auth/         # OAuth callbacks
│   └── @modal/       # Sidebar modal intercept
├── components/       # React components (ui/, deals/, user/, layout/)
├── db/               # Drizzle ORM (schema/, client.ts)
├── hooks/            # TanStack Query hooks
├── lib/              # SDK clients (typesense, recharts config)
├── store/            # Zustand stores (wishlist, auth, UI, alerts)
├── services/         # API wrappers (cheapshark, steam, igdb)
└── utils/            # Supabase SSR helpers, date, formatting, analytics
```

---

## Total Estimated

| Phase | Hours | Delivery |
|-------|-------|----------|
| 0 — Foundation | ~5h | Setup ready |
| 1 — Core Data | ~25h | Functional MVP |
| 2 — Auth & User | ~10h | Authenticated users |
| 3 — Monetization | ~5h | Potential revenue |
| 4 — Social & Game | ~15h | Engagement |
| 5 — Infrastructure | ~8h | Production |
| 6 — Scale | ~15h | Optimization |
| **Total** | **~83h** | **5-6 weeks (solo dev)** |