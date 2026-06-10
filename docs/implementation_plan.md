# Implementation Plan — GameDeals (2026)

Plano de implementação baseado nos ADRs aprovados, priorizado por ROI e validação de mercado 2026.

---

## Fase 0 — Fundação (Semana 1)
**Stack**: pnpm, Biome, Tailwind v4, Drizzle schema

| Tarefa | ADR | Esforço | Depende de |
|--------|-----|---------|------------|
| pnpm migration (`pnpm import`) | ADR-012 | 10 min | — |
| Biome init (`npx biome init`) | ADR-012 | 15 min | — |
| Tailwind v4 install + `@theme` tokens | ADR-011 | 1h | — |
| Drizzle schema (games, stores, affiliates, users) | ADR-001, ADR-004 | 2h | — |
| @supabase/server init | ADR-004 | 30 min | — |
| Vitest + Playwright setup | ADR-012 | 30 min | — |
| GitHub Actions CI workflow | ADR-005 | 30 min | — |

**Resultado**: Projeto rodando pnpm + Biome + Tailwind v4 + Drizzle + tests.

---

## Fase 1 — Core Data (Semanas 2-3)
**Stack**: Server Actions, TanStack Query, Typesense Cloud

| Tarefa | ADR | Esforço |
|--------|-----|---------|
| Deals API (CheapShark + keyshops simulados) | ADR-002 | 4h |
| TanStack Query v5 migration (SWR → RQ) | ADR-003 | 4h |
| Server Actions setup (deals, games, search) | ADR-003 | 2h |
| Typesense Cloud setup + indexing | ADR-010 | 2h |
| Navbar search (Typesense instant search) | ADR-010 | 3h |
| Home page: Historical Lows + Ending Soon | ADR-008 | 4h |
| Game detail page + Sidebar Modal | ADR-008 | 4h |

---

## Fase 2 — Auth & User (Semanas 3-4)
**Stack**: Supabase Auth, @supabase/server, Drizzle

| Tarefa | ADR | Esforço |
|--------|-----|---------|
| Google + Discord + Steam OAuth | ADR-004 | 2h |
| SSR middleware (session refresh) | ADR-004 | 1h |
| User profiles (username, avatar, settings) | ADR-004 | 2h |
| Wishlist (CRUD + Zustand persist + sync) | ADR-003, ADR-008 | 3h |
| Price alerts (CRUD + threshold check) | ADR-009 | 3h |

---

## Fase 3 — Monetização (Semanas 4-5)
**Stack**: `/out` route, affiliate tables, analytics

| Tarefa | ADR | Esforço |
|--------|-----|---------|
| `/out/[storeId]/[gameSlug]` route | ADR-006 | 1h |
| Affiliate mapping table + CRUD | ADR-006 | 1h |
| Click logging (affiliate_clicks table) | ADR-006 | 1h |
| LGPD cookie banner + consent | ADR-006 | 2h |

---

## Fase 4 — Social & Gamificação (Semanas 5-6)
**Stack**: Supabase Realtime, Badge engine

| Tarefa | ADR | Esforço |
|--------|-----|---------|
| Playlists (CRUD + share + slug) | ADR-007 | 3h |
| Badge engine (check + unlock + notification) | ADR-007 | 4h |
| XP system (earn + level + profile display) | ADR-007 | 3h |
| Reviews/ratings (CRUD + RLS) | ADR-007 | 2h |
| Realtime subscriptions (badge unlock, notifs) | ADR-007 | 2h |

---

## Fase 5 — Infrastructure (Semanas 6-7)

| Tarefa | ADR | Esforço |
|--------|-----|---------|
| Price history cron (TimescaleDB ingestion) | ADR-009 | 2h |
| Price charts (Recharts + Server Actions) | ADR-009 | 3h |
| Search sync cron | ADR-010 | 1h |
| Vercel deploy + domain + SSL | ADR-005 | 1h |
| Analytics + Speed Insights | ADR-005 | 30 min |

---

## Fase 6 — Scale & Polish (Semanas 8+)

| Tarefa | Prioridade |
|--------|------------|
| Supabase pgvector + FTS hybrid search | Alta (reduz custo) |
| Semantic search ("jogos tipo..." → embeddings) | Média |
| Twitter/Reddit embeds + social sharing | Média |
| PWA + offline mode | Baixa |
| OpenNext ARM migration | Baixa |

---

## Estrutura de Diretórios Final

```
src/
├── actions/          # Server Actions (deals, search, auth, admin)
├── app/              # App Router (pages, layouts, api, out)
│   ├── (main)/       # Autenticado
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

## Total Estimado

| Fase | Horas | Entrega |
|------|-------|---------|
| 0 — Fundação | ~5h | Setup pronto |
| 1 — Core Data | ~25h | MVP funcional |
| 2 — Auth & User | ~10h | Usuários autenticados |
| 3 — Monetização | ~5h | Receita potencial |
| 4 — Social & Game | ~15h | Engajamento |
| 5 — Infra | ~8h | Produção |
| 6 — Scale | ~15h | Otimização |
| **Total** | **~83h** | **5-6 semanas (solo dev)** |