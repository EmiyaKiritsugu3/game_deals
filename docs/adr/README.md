# ADRs — Architecture Decision Records

Este diretório contém os **Architecture Decision Records** do GameDeals. Cada ADR documenta uma decisão arquitetural significativa, seu contexto, alternativas consideradas e consequências.

## Status dos ADRs

| # | Título | Status | Data |
|---|--------|--------|------|
| 001 | **Tech Stack** — Next.js 16, React 19, Tailwind v4, TypeScript, Drizzle, Supabase | ✅ Aceito | 2026-06-10 |
| 002 | **Data Source Strategy** — CheapShark API + Keyshops Simulados + Affiliates | ✅ Aceito | 2026-06-10 |
| 003 | **State Management** — Zustand + TanStack Query v5 + Server Actions + `use cache` | ✅ Aceito | 2026-06-10 |
| 004 | **Auth & Backend** — Supabase Auth + `@supabase/server` + Drizzle ORM | ✅ Aceito | 2026-06-10 |
| 005 | **Deployment Strategy** — Vercel + OpenNext (Exit Strategy) | ✅ Aceito | 2026-06-10 |
| 006 | **Affiliate Monetization** — Cloaking `/out` Route + Edge Redirect | ✅ Aceito | 2026-06-10 |
| 007 | **Gamification System** — Badges, XP, Playlists | 📝 Proposed | 2026-06-10 |
| 008 | **Routing Pattern** — App Router + Nuqs + Server Actions + Parallel Routes | ✅ Aceito | 2026-06-10 |
| 009 | **Price History Storage** — TimescaleDB + Drizzle ORM | ✅ Aceito | 2026-06-10 |
| 010 | **Search Architecture** — Typesense Cloud (MVP) → Supabase pgvector+FTS (Scale) | ✅ Aceito | 2026-06-10 |
| 011 | **Styling Architecture** — Tailwind CSS v4 (CSS-first) + Design Tokens + Glassmorphism | ✅ Aceito | 2026-06-10 |
| 012 | **Tooling Chain** — Biome, pnpm, Vitest, Playwright | ✅ Aceito | 2026-06-10 |

**Status:**
- ✅ **Aceito**: Decisão finalizada e implementada
- 📝 **Proposed**: Em discussão/revisão
- 🔄 **Superseded**: Substituído por ADR mais recente

## Templates

- `_template.md` — Template para novos ADRs

## Convenções

- ADRs são numerados sequencialmente
- Cada ADR é independente (auto-contido)
- ADRs podem referenciar outros ADRs ou arquivos do projeto
- Ao superseder um ADR, marcar o antigo como Superseded e referenciar o novo

## Referência

- [ADR-001: Full Stack Overview](ADR-001-tech-stack.md) — Ponto de partida recomendado
- [Implementation Plan](../implementation_plan.md) — Plano de implementação detalhado
- [Tech Stack Dictionary](../tech_stack_dictionary.md) — Glossário de termos técnicos