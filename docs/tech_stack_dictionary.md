# Tech Stack Dictionary — GameDeals

Glossário das tecnologias, ferramentas e conceitos usados no projeto.

## Core Framework

| Termo | Descrição | Versão |
|-------|-----------|--------|
| **Next.js** | React framework com SSR, ISR, PPR, App Router | 16.2+ |
| **React** | Biblioteca UI com Server Components, Actions, Compiler | 19 |
| **TypeScript** | Superset tipado de JavaScript | 5.x (strict) |
| **Turbopack** | Bundler Rust-based (Next.js 15+) | Default no Next.js 16 |

## Frontend

| Termo | Descrição | Doc Link |
|-------|-----------|----------|
| **Tailwind CSS v4** | CSS-first utility framework com `@theme` para design tokens | [docs](https://tailwindcss.com/docs) |
| **CSS First-class** | Paradigma Tailwind v4: CSS é a API principal, não JS config | [blog](https://tailwindcss.com/blog/tailwindcss-v4) |
| **OKLCH** | Espaço de cor perceptual usado pelo Tailwind v4 | |
| **Nuqs** | Type-safe URL search params state management | [github](https://github.com/47ng/nuqs) |
| **Framer Motion** | Animation library (page transitions, modals, staggered) | [docs](https://www.framer.com/motion/) |
| **Lucide React** | Icon library tree-shakable | [website](https://lucide.dev) |
| **Recharts** | Chart library SSR-compatible (price history) | [website](https://recharts.org) |
| **Glassmorphism** | Efeito de vidro: `backdrop-filter: blur()` + semi-transparent bg | |
| **OLED** | Fundo preto verdadeiro (#0a0a0f) para economia de bateria em OLEDs | |

## State Management

| Termo | Descrição | Uso |
|-------|-----------|-----|
| **Zustand** | Client-side state (wishlist, UI, auth) | Stores centralizadas |
| **TanStack Query v5** | Server state (API data, caching, dedup, optimistic) | Hooks useQuery/useInfiniteQuery |
| **Server Actions** | Next.js 16 mutations server-side (form submit, mutations simples) | `'use server'` |
| **`use cache`** | Next.js 16 cache API para ISR programático | `unstable_cache` wrapper |
| **Revalidation** | Invalidação de cache via `revalidatePath`/`revalidateTag` | Pós-mutation |

## Database & ORM

| Termo | Descrição |
|-------|-----------|
| **Supabase** | Backend gerenciado: PostgreSQL + Auth + Realtime + Storage + Edge Functions |
| **Drizzle ORM** | ORM type-safe para TypeScript, Edge-ready, prepared statements |
| **TimescaleDB** | Extensão PostgreSQL para séries temporais (price history) |
| **pgvector** | Extensão PostgreSQL para vector search (busca semântica) |
| **RLS** | Row Level Security — políticas de segurança no banco de dados |
| **Continuous Aggregates** | Views automaticamente atualizadas do TimescaleDB (stats price) |
| **Hypertable** | Tabela particionada por tempo no TimescaleDB |

## Auth

| Termo | Descrição |
|-------|-----------|
| **`@supabase/ssr`** | SSR session hydration + middleware Next.js |
| **`@supabase/server`** | Novo (Maio 2026): auth edge functions simplificada |
| **Social Auth** | Login via Google, Discord, Steam, GitHub |

## Search

| Termo | Descrição |
|-------|-----------|
| **Typesense Cloud** | Search managed service: typo tolerance, faceted, vector, <50ms |
| **pgvector** | PostgreSQL vector extension (fase 2: hybrid search) |
| **Full-Text Search** | PostgreSQL `tsvector` + GIN index para busca textual |

## Deployment

| Termo | Descrição |
|-------|-----------|
| **Vercel** | Plataforma de deploy com Edge Network, Cron, Analytics |
| **OpenNext** | Framework para portar Next.js para AWS/Cloudflare/Netlify |
| **Adapter API** | API estável de build do Next.js 16.2 (saída portável) |
| **Vercel Cron Jobs** | Schedule de tarefas (price ingest, search sync) |
| **ISR** | Incremental Static Regeneration — páginas estáticas com revalidação |
| **PPR** | Partial Prerendering — partes estáticas + partes dinâmicas na mesma rota |

## Tooling & DX

| Termo | Descrição | Versão |
|-------|-----------|--------|
| **Biome** | Lint + Format + Import Sort (Rust, 10-30x mais rápido) | 2.4+ |
| **pnpm** | Package manager rápido, seguro, disk-efficient | 11.5+ |
| **Vitest** | Test framework Vite-native (unit/integration) | Latest |
| **Playwright** | Multi-browser E2E testing (Chromium + Firefox + WebKit) | Latest |

## Cron Jobs (Vercel)

| Cron | Schedule | Função |
|------|----------|--------|
| **Ingest Prices** | 3am daily | Fetch CheapShark deals → upsert price_history |
| **Sync Search** | 4am daily | Indexar jogos novos no Typesense |
| **Refresh Featured** | Every 4h | Atualizar Historical Lows, Ending Soon |
| **Update Scores** | 6am daily | Recálculo de deal ratings, badges, XP |

## Deployment Settings

| Parâmetro | Valor |
|-----------|-------|
| Node version | 22.x |
| Package manager | pnpm |
| Build command | `pnpm biome ci . && pnpm build` |
| Install command | `pnpm install --frozen-lockfile` |
| Output directory | `.next`