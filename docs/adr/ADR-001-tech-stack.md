# ADR-001: Tech Stack — Next.js 16, React 19, Tailwind CSS v4, TypeScript, Supabase

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10 com pesquisa de mercado 2026)
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals é um agregador de preços de jogos (estilo gg.deals/IsThereAnyDeal) com links de afiliado, focado no mercado brasileiro. Precisamos de uma stack que suporte:

- SSR/SSG/ISR/PPR para SEO (crítico para afiliados)
- Performance e Core Web Vitals
- Type safety end-to-end
- Estilização customizada (glassmorphism, dark theme premium, OLED)
- Backend gerenciado (auth, database, realtime, vector search) sem ops overhead
- Deploy simples, escalável e portável

---

## Decisão

| Camada | Tecnologia | Versão (2026) | Justificativa |
|--------|------------|---------------|---------------|
| **Framework** | Next.js | **16.2+** (App Router, Turbopack, PPR, Adapter API) | Server Components por padrão, SSR nativo, streaming, Partial Prerendering, Adapter API estável para portabilidade |
| **Runtime** | React | **19** (Server Components, Actions, Compiler) | RSC reduzem bundle, Server Actions para mutations, Compiler otimiza builds |
| **Language** | TypeScript | **Strict** | Tipagem obrigatória; interfaces centralizadas em `src/services/api.ts` e Drizzle schema |
| **Styling** | **Tailwind CSS v4** (CSS-first) + CSS Variables | **v4.3+** | **CSS-first config**, OKLCH nativo, cascade layers, CSS vars first-class, 3.78x faster builds. **Tokens OLED/glassmorphism preservados como `@theme` values** |
| **State (Global Client)** | Zustand | Latest | Leve, TypeScript-first, persistência nativa (localStorage → Supabase sync) |
| **State (Server)** | **TanStack Query v5** + **Server Actions** + `use cache` | **v5** | RQ para queries complexas (infinite scroll, optimistic, background refetch); Server Actions + `use cache` para mutations simples e data fetching nativo |
| **Auth/DB/Realtime/Vector** | Supabase | Latest (PostgreSQL + TimescaleDB + pgvector) | PostgreSQL gerenciado, Auth social, Row Level Security, Edge Functions, TimescaleDB nativo, pgvector para hybrid search |
| **ORM** | **Drizzle ORM** | Latest | Type-safe SQL, Edge-ready, Prepared statements, Relational Queries (sem N+1), 4.6k req/s benchmarks |
| **Search** | **Typesense Cloud** (MVP) → **Supabase pgvector + FTS** (Scale) | v30.2+ | Typo tolerance nativo, faceted search, vector search, <50ms latency. Migração futura para pgvector+FTS híbrido elimina serviço extra |
| **Charts** | Recharts | Latest | Gráficos de histórico de preço no Sidebar Modal, SSR-compatible |
| **Icons** | Lucide React | Latest | Consistência visual, tree-shaking, sem SVGs crus |
| **Animations** | Framer Motion | Latest | Page transitions, modal entrance, staggered animations |
| **Deploy** | **Vercel** (Prod) + **OpenNext** (Exit Strategy) | Next.js 16.2 Adapter API | Integração nativa Next.js, Edge Network, Cron Jobs, Analytics. Adapter API estável + OpenNext V2 para AWS/Cloudflare/Netlify |
| **Analytics** | @vercel/analytics | Latest | Privacy-friendly, zero config, Core Web Vitals automáticos |
| **Lint/Format** | **Biome** | **v2.4+** | 10-30x mais rápido que ESLint+Prettier, zero config, HTML/CSS/GraphQL support |
| **Package Manager** | **pnpm** | **11.5+** | Supply-chain security, hoisting limits, disk efficient (hard links), monorepo ready |
| **Testing** | **Vitest** + **Playwright** | Latest | Vite-native unit tests, multi-browser E2E com tracing |

---

## Consequências

### Positivas
- **SEO-first**: SSR/ISR/PPR nativo garante indexação de páginas de jogos/deals
- **Type safety end-to-end**: Drizzle schema → Types → API contracts → Components
- **Design system próprio preservado**: Tailwind v4 `@theme` consome variáveis CSS existentes (glow tokens, glassmorphism, OLED colors)
- **Performance**: Turbopack, Server Components, Drizzle prepared statements, TimescaleDB continuous aggregates
- **Zero ops backend**: Supabase gerencia auth, DB, realtime, storage, edge functions, vector search
- **Deploy trivial + portável**: `git push` → Vercel; Adapter API + OpenNext para multi-cloud futuro
- **Search UX premium**: Typesense <50ms, typo tolerance, faceted filters, semantic search ready
- **Price history real**: TimescaleDB continuous aggregates = historical low verificado, não simulado
- **Developer Experience**: Biome fast lint, pnpm fast installs, Vitest/Playwright integrated

### Negativas / Trade-offs
- **Migração Tailwind v4**: Requer conversão de CSS Modules → utilities + `@theme` (mitigado: automated upgrade tool + preservação de tokens)
- **Drizzle learning curve**: SQL-like API vs Prisma (mitigado: documentação excelente, Drizzle Studio GUI)
- **Supabase vendor lock-in**: Auth/Realtime/Storage/Vector são proprietários; DB é PostgreSQL padrão (migração viável via OpenNext)
- **Next.js 16 App Router**: Curva de aprendizado (Server Components, Suspense, streaming, Actions)
- **Bundle size**: Framer Motion + Recharts + Lucide adicionam peso; mitigado com dynamic imports

### Riscos Mitigados
- **API externa instável (CheapShark)**: `force-dynamic` na Home + fallback data + try/catch em `api.ts`
- **Build falha por API down**: `dynamic = 'force-dynamic'` evita build-time data fetching
- **Search sync delay**: Cron diário Typesense → dados com até 24h delay; aceitável para catálogo
- **Price history ingestion**: Cron diário 3am UTC → TimescaleDB; continuous aggregates atualizam hourly

---

## Referências
- [Next.js 16.2 Blog](https://nextjs.org/blog/next-16-2) — Turbopack, Adapter API, AI improvements
- [Next.js Across Platforms](https://nextjs.org/blog/nextjs-across-platforms) — Adapter API, OpenNext collaboration
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first, OKLCH, 3.78x faster builds
- [Tailwind CSS v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3) — Scrollbars, webpack plugin, logical properties
- [Drizzle ORM Benchmarks](https://orm.drizzle.team/benchmarks) — 4.6k req/s, 100ms p95, prepared statements
- [Supabase @supabase/server](https://supabase.com/blog/introducing-supabase-server) — Auth SSR simplificado para Edge/Vercel/Cloudflare
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) — Hybrid search (FTS + vector)
- [Typesense v30.2](https://typesense.org/docs/30.2/api/) — Vector search, auto-schema, federated search
- [Biome v2.4](https://biomejs.dev/blog/biome-v2-4/) — Embedded snippets, HTML a11y, framework support
- [pnpm 11.5](https://pnpm.io/blog/releases/11.5) — hoistingLimits, supply-chain security
- [OpenNext](https://opennext.js.org/) — AWS/Cloudflare/Netlify adapters for Next.js