# ADR-001: Tech Stack — Next.js 16, React 19, Tailwind CSS v4, TypeScript, Supabase

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10 with 2026 market research)
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals is a game price aggregator (like gg.deals/IsThereAnyDeal) with affiliate links, focused on the Brazilian market. We need a stack that supports:

- SSR/SSG/ISR/PPR for SEO (critical for affiliates)
- Performance and Core Web Vitals
- End-to-end type safety
- Custom styling (glassmorphism, premium dark theme, OLED)
- Managed backend (auth, database, realtime, vector search) without ops overhead
- Simple, scalable, and portable deployment

---

## Decision

| Layer | Technology | Version (2026) | Justification |
|--------|------------|---------------|---------------|
| **Framework** | Next.js | **16.2+** (App Router, Turbopack, PPR, Adapter API) | Server Components by default, native SSR, streaming, Partial Prerendering, stable Adapter API for portability |
| **Runtime** | React | **19** (Server Components, Actions, Compiler) | RSC reduce bundle, Server Actions for mutations, Compiler optimizes builds |
| **Language** | TypeScript | **Strict** | Mandatory typing; interfaces centralized in `src/services/api.ts` and Drizzle schema |
| **Styling** | **Tailwind CSS v4** (CSS-first) + CSS Variables | **v4.3+** | **CSS-first config**, native OKLCH, cascade layers, CSS vars first-class, 3.78x faster builds. **OLED/glassmorphism tokens preserved as `@theme` values** |
| **State (Global Client)** | Zustand | Latest | Lightweight, TypeScript-first, native persistence (localStorage → Supabase sync) |
| **State (Server)** | **TanStack Query v5** + **Server Actions** + `use cache` | **v5** | RQ for complex queries (infinite scroll, optimistic, background refetch); Server Actions + `use cache` for simple mutations and native data fetching |
| **Auth/DB/Realtime/Vector** | Supabase | Latest (PostgreSQL + TimescaleDB + pgvector) | Managed PostgreSQL, Social Auth, Row Level Security, Edge Functions, Native TimescaleDB, pgvector for hybrid search |
| **ORM** | **Drizzle ORM** | Latest | Type-safe SQL, Edge-ready, Prepared statements, Relational Queries (no N+1), 4.6k req/s benchmarks |
| **Search** | **Typesense Cloud** (MVP) → **Supabase pgvector + FTS** (Scale) | v30.2+ | Native typo tolerance, faceted search, vector search, <50ms latency. Future migration to hybrid pgvector+FTS eliminates extra service |
| **Charts** | Recharts | Latest | Price history charts in Sidebar Modal, SSR-compatible |
| **Icons** | Lucide React | Latest | Visual consistency, tree-shaking, no raw SVGs |
| **Animations** | Framer Motion | Latest | Page transitions, modal entrance, staggered animations |
| **Deploy** | **Vercel** (Prod) + **OpenNext** (Exit Strategy) | Next.js 16.2 Adapter API | Native Next.js integration, Edge Network, Cron Jobs, Analytics. Stable Adapter API + OpenNext V2 for AWS/Cloudflare/Netlify |
| **Analytics** | @vercel/analytics | Latest | Privacy-friendly, zero config, Automatic Core Web Vitals |
| **Lint/Format** | **Biome** | **v2.4+** | 10-30x faster than ESLint+Prettier, zero config, HTML/CSS/GraphQL support |
| **Package Manager** | **pnpm** | **11.5+** | Supply-chain security, hoisting limits, disk efficient (hard links), monorepo ready |
| **Testing** | **Vitest** + **Playwright** | Latest | Vite-native unit tests, multi-browser E2E with tracing |

---

## Consequences

### Positive
- **SEO-first**: Native SSR/ISR/PPR ensures game/deal page indexing
- **End-to-end type safety**: Drizzle schema → Types → API contracts → Components
- **Preserved custom design system**: Tailwind v4 `@theme` consumes existing CSS variables (glow tokens, glassmorphism, OLED colors)
- **Performance**: Turbopack, Server Components, Drizzle prepared statements, TimescaleDB continuous aggregates
- **Zero ops backend**: Supabase manages auth, DB, realtime, storage, edge functions, vector search
- **Trivial + portable deploy**: `git push` → Vercel; Adapter API + OpenNext for future multi-cloud
- **Premium search UX**: Typesense <50ms, typo tolerance, faceted filters, semantic search ready
- **Real price history**: TimescaleDB continuous aggregates = verified historical low, not simulated
- **Developer Experience**: Biome fast lint, pnpm fast installs, Vitest/Playwright integrated

### Negative / Trade-offs
- **Tailwind v4 migration**: Requires converting CSS Modules → utilities + `@theme` (mitigated: automated upgrade tool + token preservation)
- **Drizzle learning curve**: SQL-like API vs Prisma (mitigated: excellent documentation, Drizzle Studio GUI)
- **Supabase vendor lock-in**: Auth/Realtime/Storage/Vector are proprietary; DB is standard PostgreSQL (viable migration via OpenNext)
- **Next.js 16 App Router**: Learning curve (Server Components, Suspense, streaming, Actions)
- **Bundle size**: Framer Motion + Recharts + Lucide add weight; mitigated with dynamic imports

### Mitigated Risks
- **Unstable external API (CheapShark)**: `force-dynamic` on Home + fallback data + try/catch in `api.ts`
- **Build failure from API down**: `dynamic = 'force-dynamic'` prevents build-time data fetching
- **Search sync delay**: Daily Typesense cron → data up to 24h delay; acceptable for catalog
- **Price history ingestion**: Daily cron 3am UTC → TimescaleDB; continuous aggregates update hourly

---

## References
- [Next.js 16.2 Blog](https://nextjs.org/blog/next-16-2) — Turbopack, Adapter API, AI improvements
- [Next.js Across Platforms](https://nextjs.org/blog/nextjs-across-platforms) — Adapter API, OpenNext collaboration
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first, OKLCH, 3.78x faster builds
- [Tailwind CSS v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3) — Scrollbars, webpack plugin, logical properties
- [Drizzle ORM Benchmarks](https://orm.drizzle.team/benchmarks) — 4.6k req/s, 100ms p95, prepared statements
- [Supabase @supabase/server](https://supabase.com/blog/introducing-supabase-server) — Simplified Auth SSR for Edge/Vercel/Cloudflare
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) — Hybrid search (FTS + vector)
- [Typesense v30.2](https://typesense.org/docs/30.2/api/) — Vector search, auto-schema, federated search
- [Biome v2.4](https://biomejs.dev/blog/biome-v2-4/) — Embedded snippets, HTML a11y, framework support
- [pnpm 11.5](https://pnpm.io/blog/releases/11.5) — hoistingLimits, supply-chain security
- [OpenNext](https://opennext.js.org/) — AWS/Cloudflare/Netlify adapters for Next.js