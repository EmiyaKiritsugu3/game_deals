# GameDeals 🎮

Agregador de ofertas de jogos — Next.js 16, Supabase SSR, Drizzle ORM, TanStack Query, Typesense.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript (strict) |
| Estilização | Tailwind CSS v4 |
| Banco | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Supabase SSR (server + browser client) |
| Dados | CheapShark API |
| Busca | Typesense (fallback CheapShark) |
| Client State | Zustand (wishlist, auth, alerts) |
| Server Data | TanStack Query |
| Linter/Formatter | Biome (único — sem ESLint/Prettier) |
| Dead Code | Knip |
| Auditoria | Fallow |
| E2E | Playwright |
| Unit | Vitest |
| Hooks Git | Husky v9 + lint-staged |

## Comandos

```bash
pnpm dev                  # Dev server (Turbopack)
pnpm build                # Build production (precisa .env.local)
pnpm start                # Servidor produção
pnpm lint                 # Biome check
pnpm lint:fix             # Biome check + auto-fix
pnpm format               # Biome format
pnpm test                 # Vitest unit
pnpm test:watch           # Vitest watch
pnpm test:coverage        # Vitest com cobertura
pnpm test:e2e             # Playwright E2E
pnpm check                # CI completo local (lint→tsc→test→build→knip→fallow)
pnpm knip                 # Dead code analysis
pnpm audit                # pnpm audit --audit-level=high
pnpm fallow:audit         # Fallow security audit
pnpm db:generate          # Drizzle Kit generate migration
pnpm db:migrate           # Drizzle Kit apply migrations
pnpm db:push              # Drizzle Kit push schema (dev)
pnpm db:studio            # Drizzle Studio (visual DB browser)
```

## CI Local

Pre-commit: `pnpm exec lint-staged` (Biome format nos arquivos staged).
Pre-push: `pnpm check` (lint → tsc → test → build → knip → fallow).
CI (GitHub Actions): `.github/workflows/ci.yml` — mesmos passos.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron | Service role key |
| `CRON_SECRET` | Cron | Protege endpoints `/api/cron/*` |
| `TYPESENSE_ADMIN_KEY` | Search | Admin key (server-side) |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Search | Search-only key (client-safe) |
| `NEXT_PUBLIC_TYPESENSE_URL` | Search | Typesense host |

## Estrutura

```
src/
  app/              # App Router (layout + páginas + rotas)
    api/cron/       # Endpoints cron (CRON_SECRET)
    @modal/         # Intercepted route modal
    game/[id]/      # Detalhe do jogo
    out/            # Redirect de afiliado
    wishlist/       # Wishlist (protegida)
    search/         # Busca
    bundles/        # Bundles
    collections/    # Coleções
  actions/          # Server Actions
  components/       # Componentes React
  db/               # Drizzle client + schema
  hooks/            # TanStack Query hooks
  lib/              # Configs (Typesense, afiliados)
  services/         # API client (CheapShark)
  store/            # Zustand stores
  utils/            # Supabase clients (server/middleware/browser)
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Index](docs/index.md) | Visão geral da documentação |
| [Arquitetura](docs/architecture/) | Decisões arquiteturais e diagramas |
| [API Reference](docs/api-reference.md) | Referência de endpoints e Server Actions |
| [Runbook](docs/runbook.md) | Procedimentos operacionais e troubleshooting |
| [Glossário](docs/glossary.md) | Termos e conceitos do projeto |
| [Contribuição](CONTRIBUTING.md) | Guia de contribuição |
| [Test Strategy](docs/test-strategy.md) | Estratégia de testes e cobertura |
