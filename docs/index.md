# GameDeals Documentation Hub

Central entry point for all project documentation. New here? Start with **Quick Start** below.

---

## Quick Start

| Resource | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, stack, commands, setup, env vars, structure |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute: branching, commits, PR workflow, code standards |

---

## New Developers

Start here if you're onboarding or unfamiliar with the codebase.

| Resource | Description |
|----------|-------------|
| [Manual — Chapter 1: Architecture & Decisions](manual/01-architecture-and-decisions.md) | High-level architecture walkthrough and key design choices |
| [Manual — Chapter 2: API & Services](manual/02-api-and-services.md) | CheapShark API client, Server Actions, TanStack Query hooks |
| [Manual — Chapter 3: Gamification & State](manual/03-gamification-and-state.md) | Zustand stores, gamification system, SyncManager |
| [Manual — Chapter 4: Pages & Routing](manual/04-pages-routing.md) | App Router structure, intercepted routes, parallel routes |
| [Manual — Chapter 5: Core Components](manual/05-core-components.md) | Navbar, AuthModal, SyncManager, WishlistIndicator, CookieBanner |
| [Manual — Chapter 6: Feature Components](manual/06-feature-components.md) | GameCard, DealTable, PriceChart, search, filters |
| [Manual — README](manual/README.md) | Manual overview and navigation |
| [Glossary](glossary.md) | Domain terminology and abbreviations |
| [Tech Stack Dictionary](tech_stack_dictionary.md) | Technology definitions and rationale |
| [Use Cases](use-cases.md) | User journeys: browse, search, wishlist, alerts, playlists, affiliate, collections |

---

## Daily Operations

Things you reach for during regular development and maintenance.

| Resource | Description |
|----------|-------------|
| [Runbook](runbook.md) | Common tasks: dev server, DB migrations, cron jobs, debugging |⏳ Planned
| [API Reference](api-reference.md) | Endpoint docs: internal Server Actions, external CheapShark API |⏳ Planned
| [ADR — Tooling Chain](adr/ADR-012-tooling-chain.md) | Biome, pnpm, Vitest, Playwright — tools and config reference |
| [Deployment Guide — Vercel](vercel_deployment_guide.md) | Vercel setup, env vars, build config |
| [Deployment Guide — Clean](clean_deployment_guide.md) | Production deployment checklist and verification |
| [Supabase Setup Guide](supabase_setup_guide.md) | Local Supabase, migrations, RLS policies |
| [Test Strategy](test-strategy.md) | Unit (Vitest) and E2E (Playwright) testing approach |⏳ Planned
| [Release Process](release-process.md) | Versioning, changelog, staging, production cut |⏳ Planned
| [Templates — Postmortem](templates/postmortem-template.md) | Incident postmortem structure |
| [Templates — PR FAQ](templates/pr-faq-template.md) | FAQ template for PR reviews |
| [Templates — README](templates/README.md) | Template conventions and usage guide |

---

## Architecture Decisions

Design records explaining why the project is built the way it is.

| # | Resource | Status |
|---|----------|--------|
| 001 | [Tech Stack](adr/ADR-001-tech-stack.md) — Next.js 16, React 19, Tailwind v4, Drizzle, Supabase | ✅ Accepted |
| 002 | [Data Source Strategy](adr/ADR-002-data-source-strategy.md) — CheapShark API, simulated keyshops, affiliates | ✅ Accepted |
| 003 | [State Management](adr/ADR-003-state-management.md) — Zustand, TanStack Query, Server Actions, `use cache` | ✅ Accepted |
| 004 | [Auth & Backend](adr/ADR-004-auth-backend.md) — Supabase Auth + `@supabase/ssr` + Drizzle ORM | ✅ Accepted |
| 005 | [Deployment Strategy](adr/ADR-005-deployment-strategy.md) — Vercel + OpenNext exit strategy | ✅ Accepted |
| 006 | [Affiliate Monetization](adr/ADR-006-affiliate-monetization.md) — Cloaking `/out` route, edge redirect | ✅ Accepted |
| 007 | [Gamification System](adr/ADR-007-gamification-system.md) — Badges, XP, playlists | 📝 Proposed |
| 008 | [Routing Pattern](adr/ADR-008-routing-pattern.md) — App Router, Nuqs, Server Actions, parallel routes | ✅ Accepted |
| 009 | [Price History Storage](adr/ADR-009-price-history-storage.md) — TimescaleDB + Drizzle ORM | ✅ Accepted |
| 010 | [Search Architecture](adr/ADR-010-search-architecture.md) — Typesense Cloud → Supabase pgvector+FTS | ✅ Accepted |
| 011 | [Styling Architecture](adr/ADR-011-styling-tailwind-v4.md) — Tailwind CSS v4, design tokens, glassmorphism | ✅ Accepted |
| 012 | [Tooling Chain](adr/ADR-012-tooling-chain.md) — Biome, pnpm, Vitest, Playwright | ✅ Accepted |

Full listing: [ADR Index](adr/README.md) | Template: [New ADR](adr/_template.md)

---

## Security & Compliance

| Resource | Description |
|----------|-------------|
| [Threat Model](security/threat-model.md) | Security analysis: threats, mitigations, trust boundaries |⏳ Planned
| [Security Guidelines](security/) | Authentication, RLS policies, secrets management, audit |⏳ Planned
| [Archive — Security Notes](archive/README.md) | Deprecated or historical security-related documents |

---

## Diagrams & Visual Reference

| Resource | Description |
|----------|-------------|
| [C4 System Context](architecture/c4-system-context.md) | System scope, users, external integrations |⏳ Planned
| [C4 Container](architecture/c4-container.md) | High-level container diagram (web app, DB, search, API) |⏳ Planned
| [C4 Component](architecture/c4-component.md) | Component-level architecture inside containers |⏳ Planned
| [Data Flow](architecture/data-flow.md) | Request lifecycle: page load, search, price alerts, cron |⏳ Planned

---

## Archives

Outdated or superseded documents are preserved in [archive/](archive/README.md) for historical reference.

---

> **Legend:** ✅ Existing | 📝 Proposed/Draft | ⏳ Planned (not yet written)
