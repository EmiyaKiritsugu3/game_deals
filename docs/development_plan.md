# GameDeals — Plano de Desenvolvimento 2026

## Legenda
`[dep: X]` = depende de X estar completo
`~30m` = estimativa de esforço

---

## FASE 0 — Foundation ✅ (COMPLETA)
- [x] pnpm + Biome + Tailwind v4 + Drizzle ORM + Vitest
- [x] 12 ADRs validados

---

## FASE 1 — Database + Auth (2-3h)
**Objetivo**: Supabase conectado, usuário loga, sessão SSR funciona.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 1.1 | Configurar Supabase project (dashboard) + pegar URL/keys | 15m | — |
| 1.2 | `DATABASE_URL` + `SUPABASE_*` no `.env.local` | 5m | 1.1 |
| 1.3 | Rodar `pnpm db:generate` + `pnpm db:migrate` (criar tabelas) | 10m | 1.2 |
| 1.4 | Finalizar `src/utils/supabase/server.ts` + `middleware.ts` (já criados) | 30m | 1.2 |
| 1.5 | AuthModal (login Google/Discord/Steam) funcional | 1h | 1.4 |
| 1.6 | AuthStore (Zustand) sync com sessão SSR | 30m | 1.5 |
| 1.7 | Testar: login → middleware protege rotas → logout | 15m | 1.6 |

**Entregável**: Usuário loga com Google/Discord, sessão persiste em SSR, rotas protegidas funcionam.

---

## FASE 2 — Data Layer (3-4h)
**Objetivo**: CheapShark API integrada via Server Actions + TanStack Query, dados no banco.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 2.1 | `src/actions/deals.ts` — Server Actions p/ CheapShark com `use cache` | 45m | 1.3 |
| 2.2 | `src/hooks/useDeals.ts` — TanStack Query hooks (home, search, game detail) | 45m | 2.1 |
| 2.3 | `src/actions/prices.ts` — Ingestão de preços no banco (cron job) | 1h | 1.3, 2.1 |
| 2.4 | Fallback deals (`src/data/fallbackDeals.ts`) — compile-time data | 30m | — |
| 2.5 | Testar: home page carrega deals, fallback funciona, TanStack Query cacheia | 30m | 2.2, 2.4 |
| 2.6 | Preparar cron job Vercel p/ price ingestion (cron 4h) | 30m | 2.3 |

**Entregável**: Home page mostra deals reais da CheapShark com cache e fallback.

---

## FASE 3 — Affiliate + Cloaking (2h)
**Objetivo**: Links de afiliado funcionando com `/out` route + tracking.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 3.1 | Mapear `storeId → affiliate network` no banco (seed) | 30m | 1.3 |
| 3.2 | `src/app/out/[storeId]/[gameSlug]/route.ts` — Edge redirect + click log | 45m | 1.3 |
| 3.3 | `AffiliateLink` no frontend (DealRow usa link /out) | 30m | 3.2 |
| 3.4 | Cookie banner LGPD + consentimento | 30m | — |

**Entregável**: Clique em deal → redirect `/out/steam/game-123` → loga click → redirect pra Steam com tracking.

---

## FASE 4 — Search (2-3h)
**Objetivo**: Navbar search funcional com Typesense Cloud.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 4.1 | Criar cluster Typesense Cloud (free tier) + API key | 15m | — |
| 4.2 | `src/lib/typesense.ts` — client + schema + sync function | 45m | 4.1 |
| 4.3 | `src/actions/search.ts` — Server Actions wrapper | 30m | 4.2 |
| 4.4 | Navbar search dropdown com TanStack Query + debounce | 1h | 4.3 |
| 4.5 | Cron: daily reindex de jogos atualizados | 30m | 4.2 |

**Entregável**: Digitar no Navbar → resultados em <100ms com typo tolerance.

---

## FASE 5 — Price History + TimescaleDB (3h)
**Objetivo**: Gráficos de histórico de preços com TimescaleDB.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 5.1 | Ativar extensão TimescaleDB no Supabase | 10m | — |
| 5.2 | Migrar `price_history` para hypertable TimescaleDB | 30m | 1.3 |
| 5.3 | Continuous aggregate (hourly/daily rollup) | 45m | 5.2 |
| 5.4 | `src/hooks/usePriceHistory.ts` — TanStack Query hook | 30m | 5.2 |
| 5.5 | Gráfico Recharts no game detail modal | 1h | 5.4 |

**Entregável**: Game detail mostra gráfico de preço histórico com rollups diários.

---

## FASE 6 — User Features (4-5h)
**Objetivo**: Wishlist, playlists, price alerts, gamificação.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 6.1 | Wishlist — sync Zustand local → Supabase on login | 1h | 1.6 |
| 6.2 | Playlists — CRUD (create, add game, share, public/private) | 1.5h | 1.6 |
| 6.3 | Price alerts — criar alerta, checar via cron, notificar | 1.5h | 2.3, 1.6 |
| 6.4 | Gamificação — XP tracking + badges (compras, reviews, login streak) | 1h | 1.6 |

**Entregável**: Usuário logado tem wishlist, playlists, price alerts, XP e badges.

---

## FASE 7 — Polish + SEO (3h)
**Objetivo**: Performance, SEO, analytics, deploy.

| # | Tarefa | Est. | Dep. |
|---|--------|------|------|
| 7.1 | Metadados SEO (opengraph, structured data, sitemap) | 45m | — |
| 7.2 | PPR (Partial Prerendering) nas páginas principais | 30m | — |
| 7.3 | ISR on-demand p/ deals page (revalidateTag) | 30m | 2.1 |
| 7.4 | Vercel Analytics + Speed Insights configurados (já instalado) | 15m | — |
| 7.5 | Migração Tailwind v4 dos componentes principais (Fase 1-2 do ADR-011) | 1h | — |

**Entregável**: Lighthouse 90+ em mobile, sitemap.xml, OG images.

---

## FASE 8 — Scale + Exit Strategy (quando precisar)
- [ ] Migrar Typesense → pgvector + FTS híbrido
- [ ] OpenNext → Fly.io / Railway (exit Vercel)
- [ ] Cache distribuído (Redis/KV)
- [ ] CDN de imagens (Cloudflare Images)

---

## Ordem Recomendada

```
FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7
```

Cada fase é **standalone** depois das anteriores. Pode parar em qualquer fase e ter algo funcional.

## Próximo: O que fazer agora?
"FASE 1 — Database + Auth" — é a fundação de tudo. Sem ela, nada salva no banco, ninguém loga.
