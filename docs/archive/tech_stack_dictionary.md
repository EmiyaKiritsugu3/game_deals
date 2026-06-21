---
title: Tech Stack Dictionary (SUPERSEDED — see tech-stack.md)
type: reference
status: superseded
scope: project
tags:
  - tech-stack
  - dictionary
  - archived
related:
  - tech-stack
  - adr/ADR-001-tech-stack
updated: "2026-06-21"
---

# Tech Stack Dictionary — GameDeals

Glossary of technologies, tools, and concepts used in the project.

## Core Framework

| Term | Description | Version |
|------|-------------|---------|
| **Next.js** | React framework with SSR, ISR, PPR, App Router | 16.2+ |
| **React** | UI library with Server Components, Actions, Compiler | 19 |
| **TypeScript** | Typed superset of JavaScript | 5.x (strict) |
| **Turbopack** | Rust-based bundler (Next.js 15+) | Default in Next.js 16 |

## Frontend

| Term | Description | Doc Link |
|------|-------------|----------|
| **Tailwind CSS v4** | CSS-first utility framework with `@theme` for design tokens | [docs](https://tailwindcss.com/docs) |
| **CSS First-class** | Tailwind v4 paradigm: CSS is the main API, not JS config | [blog](https://tailwindcss.com/blog/tailwindcss-v4) |
| **OKLCH** | Perceptual color space used by Tailwind v4 | |
| **Nuqs** | Type-safe URL search params state management | [github](https://github.com/47ng/nuqs) |
| **Framer Motion** | Animation library (page transitions, modals, staggered) | [docs](https://www.framer.com/motion/) |
| **Lucide React** | Icon library tree-shakable | [website](https://lucide.dev) |
| **Recharts** | Chart library SSR-compatible (price history) | [website](https://recharts.org) |
| **Glassmorphism** | Glass effect: `backdrop-filter: blur()` + semi-transparent bg | |
| **OLED** | True black background (#0a0a0f) for battery saving on OLEDs | |

## State Management

| Term | Description | Usage |
|------|-------------|-------|
| **Zustand** | Client-side state (wishlist, UI, auth) | Centralized stores |
| **TanStack Query v5** | Server state (API data, caching, dedup, optimistic) | useQuery/useInfiniteQuery hooks |
| **Server Actions** | Next.js 16 server-side mutations (form submit, simple mutations) | `'use server'` |
| **`use cache`** | Next.js 16 cache API for programmatic ISR | `unstable_cache` wrapper |
| **Revalidation** | Cache invalidation via `revalidatePath`/`revalidateTag` | Post-mutation |

## Database & ORM

| Term | Description |
|------|-------------|
| **Supabase** | Managed backend: PostgreSQL + Auth + Realtime + Storage + Edge Functions |
| **Drizzle ORM** | Type-safe ORM for TypeScript, Edge-ready, prepared statements |
| **TimescaleDB** | PostgreSQL extension for time series (price history) |
| **pgvector** | PostgreSQL extension for vector search (semantic search) |
| **RLS** | Row Level Security — database security policies |
| **Continuous Aggregates** | Automatically updated views from TimescaleDB (price stats) |
| **Hypertable** | Time-partitioned table in TimescaleDB |

## Auth

| Term | Description |
|------|-------------|
| **`@supabase/ssr`** | SSR session hydration + Next.js middleware |
| **`@supabase/server`** | New (May 2026): simplified auth edge functions |
| **Social Auth** | Login via Google, Discord, Steam, GitHub |

## Search

| Term | Description |
|-------|-----------|
| **Typesense Cloud** | Managed search service: typo tolerance, faceted, vector, <50ms |
| **pgvector** | PostgreSQL vector extension (phase 2: hybrid search) |
| **Full-Text Search** | PostgreSQL `tsvector` + GIN index for text search |

## Deployment

| Term | Description |
|------|-------------|
| **Vercel** | Deploy platform with Edge Network, Cron, Analytics |
| **OpenNext** | Framework to port Next.js to AWS/Cloudflare/Netlify |
| **Adapter API** | Stable Next.js 16.2 build API (portable output) |
| **Vercel Cron Jobs** | Task scheduling (price ingest, search sync) |
| **ISR** | Incremental Static Regeneration — static pages with revalidation |
| **PPR** | Partial Prerendering — static parts + dynamic parts on same route |

## Tooling & DX

| Term | Description | Version |
|------|-------------|---------|
| **Biome** | Lint + Format + Import Sort (Rust, 10-30x faster) | 2.4+ |
| **pnpm** | Fast, secure, disk-efficient package manager | 11.5+ |
| **Vitest** | Test framework Vite-native (unit/integration) | Latest |
| **Playwright** | Multi-browser E2E testing (Chromium + Firefox + WebKit) | Latest |

## Cron Jobs (Vercel)

| Cron | Schedule | Function |
|------|----------|--------|
| **Ingest Prices** | 3am daily | Fetch CheapShark deals → upsert price_history |
| **Sync Search** | 4am daily | Index new games in Typesense |
| **Refresh Featured** | Every 4h | Update Historical Lows, Ending Soon |
| **Update Scores** | 6am daily | Recalculate deal ratings, badges, XP |

## Deployment Settings

| Parameter | Value |
|-----------|-------|
| Node version | 22.x |
| Package manager | pnpm |
| Build command | `pnpm biome ci . && pnpm build` |
| Install command | `pnpm install --frozen-lockfile` |
| Output directory | `.next`