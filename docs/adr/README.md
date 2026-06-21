# ADRs — Architecture Decision Records

This directory contains the **Architecture Decision Records** for GameDeals. Each ADR documents a significant architectural decision — its context, alternatives considered, and consequences.

## ADR Status

| # | Title | Status | Date |
|---|-------|--------|------|
| 001 | **Tech Stack** — Next.js 16, React 19, Tailwind CSS v4, TypeScript, Supabase | ✅ Accepted | 2026-06-10 |
| 002 | **Data Source Strategy** — CheapShark API + Simulated Keyshops | ✅ Accepted | 2026-06-10 |
| 003 | **State Management** — Zustand + TanStack Query v5 + Server Actions | ✅ Accepted | 2026-06-10 |
| 004 | **Auth & Backend Architecture** — Supabase Auth + @supabase/server + Drizzle ORM | ✅ Accepted | 2026-06-10 |
| 005 | **Deployment Strategy** — Vercel + OpenNext (Exit Strategy) | ✅ Accepted | 2026-06-10 |
| 006 | **Affiliate Monetization** — Cloaking Gateway /out Route | ✅ Accepted | 2026-06-10 |
| 007 | **Gamification System** — Badges, XP, Playlists | 📝 Proposed | 2026-06-10 |
| 008 | **Routing Pattern** — App Router (Next.js 16) + Nuqs + Server Actions | ✅ Accepted | 2026-06-10 |
| 009 | **Price History Storage** — TimescaleDB (via Supabase) + Drizzle ORM | ✅ Accepted | 2026-06-10 |
| 010 | **Search Architecture** — Typesense Cloud (MVP) → Supabase pgvector+FTS (Scale) | ✅ Accepted | 2026-06-10 |
| 011 | **Styling Architecture** — Tailwind CSS v4 (CSS-first) + Design Tokens | ✅ Accepted | 2026-06-10 |
| 012 | **Tooling Chain** — Biome, pnpm, Vitest, Playwright | ✅ Accepted | 2026-06-10 |

**Status legend:**
- ✅ **Accepted**: Decision finalized and implemented
- 📝 **Proposed**: Under discussion/review
- 🔄 **Superseded**: Replaced by a newer ADR

## Templates

- `_template.md` — Template for new ADRs

## Conventions

- ADRs are sequentially numbered
- Each ADR is self-contained
- ADRs may reference other ADRs or project files
- When superseding an ADR, mark the old one as Superseded and reference the new one

## References

- [ADR-001: Full Stack Overview](ADR-001-tech-stack.md) — Recommended starting point
- [Tech Stack Reference](../tech-stack.md) — Canonical technology reference
- [Glossary](../glossary.md) — Domain terminology