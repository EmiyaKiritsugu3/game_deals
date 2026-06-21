---
title: GameDeals Documentation Hub
type: index
status: active
scope: project
tags:
  - docs
  - index
  - ai-navigation
related:
  - AI-NAVIGATION
  - tech-stack
  - index
updated: "2026-06-21"
---

# GameDeals Documentation Hub

**For AI agents:** Read [AI-NAVIGATION.md](AI-NAVIGATION.md) first. It routes tasks to the right docs.

---

## Quick Start

| Priority | Resource | Description |
|----------|----------|-------------|
| MUST READ | [README.md](../README.md) | Stack, commands, setup, env vars, structure |
| MUST READ | [CONTRIBUTING.md](../CONTRIBUTING.md) | Branching, commits, PR workflow, code standards |
| MUST READ | [AI-NAVIGATION.md](AI-NAVIGATION.md) | Protocol for AI agents navigating this corpus |

---

## New Developers

| Priority | Resource | Description |
|----------|----------|-------------|
| MUST READ | [Onboarding](onboarding.md) | Clone, env setup, migrations, dev server |
| REFERENCE | [Manual — Chapter 1: Architecture & Decisions](manual/01-architecture-and-decisions.md) | High-level architecture walkthrough |
| REFERENCE | [Manual — Chapter 2: API & Services](manual/02-api-and-services.md) | CheapShark API client, Server Actions, TanStack Query hooks |
| REFERENCE | [Manual — Chapter 3: Gamification & State](manual/03-gamification-and-state.md) | Zustand stores, gamification system, SyncManager |
| REFERENCE | [Manual — Chapter 4: Pages & Routing](manual/04-pages-routing.md) | App Router structure, intercepted routes, parallel routes |
| REFERENCE | [Manual — Chapter 5: Core Components](manual/05-core-components.md) | Navbar, AuthModal, SyncManager, WishlistIndicator, CookieBanner |
| REFERENCE | [Manual — Chapter 6: Feature Components](manual/06-feature-components.md) | GameCard, DealTable, PriceChart, search, filters |
| REFERENCE | [Glossary](glossary.md) | Domain terminology and abbreviations |
| REFERENCE | [Use Cases](use-cases.md) | User journeys: browse, search, wishlist, alerts, playlists, affiliate, collections |

---

## Daily Operations

| Priority | Resource | Description |
|----------|----------|-------------|
| MUST READ | [Runbook](runbook.md) | Cron failures, DB pool exhaustion, auth outage, deployment troubleshooting |
| MUST READ | [API Reference](api-reference.md) | Cron endpoints, Server Actions, CheapShark API contract |
| MUST READ | [Test Strategy](test-strategy.md) | Unit, component, E2E, visual testing approach |
| REFERENCE | [ADR — Tooling Chain](adr/ADR-012-tooling-chain.md) | Biome, pnpm, Vitest, Playwright |
| REFERENCE | [Deployment Guide — Vercel](vercel_deployment_guide.md) | Vercel setup, env vars, build config |
| REFERENCE | [Supabase Setup Guide](supabase_setup_guide.md) | Local Supabase, migrations, RLS policies |
| REFERENCE | [Release Process](release-process.md) | Versioning, changelog, staging, production cut |
| REFERENCE | [Templates — Postmortem](templates/postmortem-template.md) | Incident postmortem structure |
| REFERENCE | [Templates — PR FAQ](templates/pr-faq-template.md) | FAQ template for PR reviews |

---

## Architecture Decisions

| Priority | # | Resource | Status |
|----------|---|----------|--------|
| MUST READ | 001 | [Tech Stack](adr/ADR-001-tech-stack.md) | ✅ Accepted |
| MUST READ | 002 | [Data Source Strategy](adr/ADR-002-data-source-strategy.md) | ✅ Accepted |
| MUST READ | 003 | [State Management](adr/ADR-003-state-management.md) | ✅ Accepted |
| MUST READ | 004 | [Auth & Backend](adr/ADR-004-auth-backend.md) | ✅ Accepted |
| MUST READ | 005 | [Deployment Strategy](adr/ADR-005-deployment-strategy.md) | ✅ Accepted |
| REFERENCE | 006 | [Affiliate Monetization](adr/ADR-006-affiliate-monetization.md) | ✅ Accepted |
| REFERENCE | 007 | [Gamification System](adr/ADR-007-gamification-system.md) | 📝 Proposed |
| MUST READ | 008 | [Routing Pattern](adr/ADR-008-routing-pattern.md) | ✅ Accepted |
| MUST READ | 009 | [Price History Storage](adr/ADR-009-price-history-storage.md) | ✅ Accepted |
| MUST READ | 010 | [Search Architecture](adr/ADR-010-search-architecture.md) | ✅ Accepted |
| MUST READ | 011 | [Styling Architecture](adr/ADR-011-styling-tailwind-v4.md) | ✅ Accepted |
| MUST READ | 012 | [Tooling Chain](adr/ADR-012-tooling-chain.md) | ✅ Accepted |

Full listing: [ADR Index](adr/README.md) | Template: [New ADR](adr/_template.md)

---

## Reference by Domain

| Domain | Priority | Resource | Description |
|--------|----------|----------|-------------|
| Tech Stack | MUST READ | [Tech Stack](tech-stack.md) | Canonical source of truth for all technology choices |
| Database | MUST READ | [Database Schema](database-schema.md) | ERD, tables, indexes, migration status |
| Design | REFERENCE | [Design System](design-system.md) | Color tokens, typography, component styles |
| Accessibility | MUST READ | [Accessibility](accessibility.md) | WCAG 2.1 AA checklist, a11y patterns, gaps |
| Security | MUST READ | [Threat Model](security/threat-model.md) | STRIDE analysis: threats, mitigations, trust boundaries |
| Monitoring | REFERENCE | [Monitoring & Observability](monitoring.md) | Sentry, Vercel Analytics, error tracking |
| SEO | REFERENCE | [SEO Strategy](seo.md) | Metadata, structured data, sitemap |
| Technical Debt | REFERENCE | [Technical Debt Register](technical-debt.md) | Known debt items and status |
| PRD | REFERENCE | [PRD](prd.md) | Product requirements — partially stale, audit before relying |

---

## Diagrams & Visual Reference

| Priority | Resource | Description |
|----------|----------|-------------|
| REFERENCE | [C4 System Context](architecture/c4-system-context.md) | System scope, users, external integrations |
| REFERENCE | [C4 Container](architecture/c4-container.md) | High-level container diagram |
| REFERENCE | [C4 Component](architecture/c4-component.md) | Component-level architecture |
| MUST READ | [Data Flow](architecture/data-flow.md) | Request lifecycle: page load, search, price alerts, cron |

---

## Session Reports

| Priority | Report | Description |
|----------|--------|-------------|
| REFERENCE | [Sprint 11 — A11y & Quality](compose/reports/sprint11-accessibility-and-quality.md) | Discord icon fix, aria-live regions, UserMenu a11y, CI audit, GameBody cleanup |
| REFERENCE | [PR #36 — PRD Audit & Evolution](reports/prd-evolution-report.md) | PRD audit (20+ fixes), 10 new production sections |
| ARCHIVE | [PR #10 — Quality Fix](reports/pr10-session-report.md) | Superseded by Sprint 11; historical only |
| ARCHIVE | [PR #12 — P0 Notifications Pipeline](reports/pr12-session-report.md) | Superseded by Sprint 11; historical only |
| ARCHIVE | [PR #15 — Price Alerts E2E](reports/pr15-session-report.md) | Superseded by Sprint 11; historical only |

---

## Archives

Outdated or superseded documents are preserved in [archive/](archive/README.md) for historical reference. **Do not read archive docs unless debugging history.**

---

> **Legend:** MUST READ = required for most tasks | REFERENCE = read on demand | ARCHIVE = historical only
