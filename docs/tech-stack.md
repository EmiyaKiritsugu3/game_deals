---
title: Tech Stack — GameDeals
type: reference
status: active
scope: project
tags:
  - tech-stack
  - architecture
  - reference
related:
  - adr/ADR-001-tech-stack
  - adr/ADR-011-styling-tailwind-v4
  - adr/ADR-012-tooling-chain
updated: "2026-06-21"
---

# Tech Stack — GameDeals

**Canonical source of truth for technology choices.** All other docs reference this file.

## Stack Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 16 (App Router, Turbopack) | React framework, SSR/RSC, ISR |
| Language | TypeScript | 5.9+ (strict) | Type safety |
| Styling | Tailwind CSS | v4 (CSS-first) | Utility-first styling, design tokens |
| Database | PostgreSQL (Supabase) | 16+ | Primary data store |
| ORM | Drizzle ORM | 0.38+ | Type-safe SQL |
| Auth | Supabase SSR | @supabase/ssr | Server + browser auth |
| Data Source | CheapShark API | REST | Game deals data |
| Search | Typesense Cloud | 27.0+ | Search acceleration |
| Client State | Zustand | 4.5+ | Wishlist, auth, alerts |
| Server Data | TanStack Query | v5 | Caching, refetching, mutations |
| Lint/Format | Biome | v2.4+ | Linting + formatting |
| Dead Code | Knip | 6.16+ | Unused code detection |
| Audit | Fallow | 2.94+ | Complexity, duplication |
| E2E | Playwright | 1.60+ | Browser automation |
| Unit | Vitest | 4.1+ | Node + jsdom tests |
| PWA | Serwist | 9.0+ | Service worker |
| Theme | next-themes | 0.4+ | Dark/light/system |
| Analytics | Vercel Web Analytics | - | Privacy-friendly analytics |

## Key Architectural Decisions (linked)

- **ADR-001**: Overall tech stack rationale
- **ADR-002**: Data source strategy (CheapShark + simulated keyshops)
- **ADR-003**: State management (Zustand + TanStack Query + Server Actions)
- **ADR-004**: Auth backend (Supabase + Drizzle)
- **ADR-005**: Deployment (Vercel + OpenNext exit)
- **ADR-006**: Affiliate monetization (/out cloaking)
- **ADR-007**: Gamification (badges, XP, playlists)
- **ADR-008**: Routing (App Router + Nuqs + Server Actions)
- **ADR-009**: Price history (TimescaleDB + Drizzle)
- **ADR-010**: Search (Typesense → pgvector)
- **ADR-011**: Styling (Tailwind v4 + design tokens)
- **ADR-012**: Tooling (Biome, pnpm, Vitest, Playwright)

## Package Manager

```bash
pnpm 11.8.0
```

## Node.js

```bash
Node 22+ (Vercel uses 22 by default)
```

## CI Pipeline Order

1. `biome check .` — Lint + format
2. `tsc --noEmit` — Type check
3. `pnpm test:coverage` — Tests + coverage
4. `pnpm build` — Production build
5. `pnpm knip` — Dead code analysis
6. `pnpm fallow:audit` — Complexity/duplication audit
7. `sonarcloud` — Quality gate (coverage ≥ 80% new code)
8. `semgrep` — Security scan
9. `gitguardian` — Secrets scan

---

## Relações

- [ADR-001](../adr/ADR-001-tech-stack.md) — Decisão arquitetural original que definiu este stack
- [ADR-011](../adr/ADR-011-styling-tailwind-v4.md) — Detalhes da arquitetura de styling
- [ADR-012](../adr/ADR-012-tooling-chain.md) — Configurações de tooling
- [database-schema.md](../database-schema.md) — Schema Drizzle que implementa este stack
- [runbook.md](../runbook.md) — Operações que dependem destas tecnologias