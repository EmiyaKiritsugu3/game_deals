# 🏗️ 01. Architecture and Fundamental Decisions

This document merges the Tech Stack Dictionary with the Architecture Analysis. It serves to answer the most important question: **Why was the project built this way?**

> **Versioning note:** This manual reflects the current stack (2026). Formally recorded architectural decisions are in the ADRs (`docs/adr/`), which are the source of truth — when this manual diverges from an ADR, the ADR prevails.

## 1. The Core Framework: Next.js 16 (App Router, Turbopack)

- **The Choice:** Next.js 16 with App Router, Turbopack as the default bundler, React 19 as the runtime. The stack runs strictly on Server Components by default.
- **The Why:** GameDeals is a price aggregator heavily focused on SEO and Core Web Vitals. The App Router allows data fetching to happen on the server, without sending heavy JavaScript to the client. Turbopack reduces build and refresh time in development (~3x faster than webpack). React 19 brings stable Server Actions and the Compiler for automatic optimization of memos and callbacks.
- **ISR as Cache Strategy:** The home page (`src/app/page.tsx`) uses `export const revalidate = 3600` — Incremental Static Regeneration with revalidation every 1 hour. This means the page is statically generated at build time and revalidated in the background every 3600 seconds. Unlike `force-dynamic`, ISR delivers static HTML to the end user (maximum performance) while keeping data up to date. If the CheapShark API fails during revalidation, the previous cache continues serving — the page never breaks.
- **Data Fallback:** `src/data/fallbackDeals.ts` contains a hardcoded array of deals. If the external API returns empty or an error, components receive this fallback. The UI never displays an empty or broken state.
- **Golden Rule:** `'use client'` is used surgically. Only peripheral interactive components (Navbar with reactive search, wishlist modals, price alerts, heart indicators) are Client Components. All heavy structure (Hero, deal lists, base charts) is born on the server.

**References:** [ADR-001: Tech Stack](docs/adr/ADR-001-tech-stack.md)

## 2. The Styling Philosophy: Tailwind CSS v4 with Design Tokens

- **The Choice:** Tailwind CSS v4 in **CSS-first** mode, with `@theme` for custom design tokens and `@utility` for GameDeals visual patterns (glassmorphism, glow effects). The configuration lives in `src/app/globals.css` via `@import "tailwindcss"` — no `tailwind.config.js` file.
- **Why:**
    1. **Productivity:** 80% of CSS becomes inline utilities (`flex`, `grid`, `gap-4`, `text-lg`). Layout, spacing, and typography no longer require `.module.css` files for each component.
    2. **Consistency:** The OLED/glassmorphism theme design tokens are centralized in the `@theme` block:
        ```css
        @theme {
          --color-oled-black: #0a0a0f;
          --color-glass-bg: rgba(15, 15, 25, 0.72);
          --blur-glass: 24px;
          --glow-primary: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15), transparent 60%);
          --color-accent-primary: #8b5cf6;
        }
        ```
    3. **Glassmorphism preserved:** The 'glass' look (backdrop-filter, blur, translucent borders) was not lost — it was encapsulated in a `@utility glass` that is applied with `className="glass"`:
        ```css
        @utility glass {
          background: var(--color-glass-bg);
          backdrop-filter: blur(var(--blur-glass));
          border: 1px solid var(--color-glass-border);
          border-radius: var(--radius-glass);
        }
        ```
    4. **Performance:** Tailwind v4 is pure CSS at build-time — zero runtime, automatic tree-shaking, 3.78x faster than v3. For a project with heavy dark theme and animations, this eliminates unused CSS in production.
- **Gradual Migration:** CSS Modules still coexist in legacy components (like `page.module.css` on the home page). The migration is component by component, without rush. The important thing is that *new* components follow Tailwind v4.
- **Animations:** Framer Motion for declarative animations (modal entrance, page transitions, staggered animations in lists). Complex `@keyframes` remain in `globals.css` below `@import`.

**References:** [ADR-011: Styling Architecture — Tailwind CSS v4](docs/adr/ADR-011-styling-tailwind-v4.md)

## 3. State, Fetching & Persistence

GameDeals manages three state layers, each with its specific tool:

### Zustand — Global Client State
- **What:** Wishlist, authentication status, price alerts, UI state (sidebar, toasts, modals).
- **Why:** Lightweight (~1KB), TypeScript-first, native `persist` middleware to sync localStorage with Supabase. Avoids prop drilling without Redux bloat.
- **Pattern:** Stores in `src/store/` with `create<State>()(persist(...))`. Example: `wishlistStore.ts` persists items in localStorage with key `gamedeals-wishlist` and later syncs with the database via Server Action.

### TanStack Query v5 — Server Data (Cache and Refetch)
- **What:** Deals queries, Navbar search, price history, game details.
- **Why:** TanStack Query v5 replaced SWR for three reasons:
    1. **Network Mode:** Native support for online/offline states.
    2. **Persisted Query Client:** Cache survives page reload.
    3. **Optimistic Updates:** Mature API for optimistic updates (add to wishlist instantly).
    4. **Server Components:** Integration via `dehydrate`/`hydrate` for SSR.
- **Pattern:** Hooks in `src/hooks/` that wrap Server Action calls with `useQuery`:
    ```typescript
    export function useWishlistGames(gameIds: string[]) {
      return useQuery({
        queryKey: ['wishlist-games', ...gameIds],
        queryFn: async () => {
          const stores = await getStores();
          const games = await Promise.all(gameIds.map((id) => getGame(id).catch(() => null)));
          return { stores, games };
        },
        enabled: gameIds.length > 0,
        staleTime: 5 * 60 * 1000,
      });
    }
    ```
    SWR no longer exists anywhere — it was completely removed.

### Server Actions — Mutation and Native Fetching Layer
- **What:** Operations that run on the server with `'use server'`. Cover 60% of data fetching cases and 100% of simple mutations.
- **Why:** Next.js 16 stabilized Server Actions. They eliminate the need for API routes for common CRUD operations: create playlist, register price alert, log affiliate click, fetch deals from CheapShark with built-in cache.
- **Pattern:** Functions in `src/actions/` that use `fetch` with `next: { revalidate }` for programmatic ISR, or Drizzle ORM for database operations:
    ```typescript
    'use server';
    export async function getDealsAction(params) {
      const url = new URL('https://www.cheapshark.com/api/1.0/deals');
      // ... params validation ...
      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) return fallbackDeals;
      return (await res.json()) as Deal[];
    }
    ```
- **Responsibility Division:**
    - **Server Components (`page.tsx`):** ISR with `revalidate = 3600` for static SEO data.
    - **Server Actions:** Mutation and fetching with granular cache per endpoint.
    - **TanStack Query:** Client-side interactivity (reactive fetching, refetch, infinite scroll, optimistic updates).
    - **Zustand:** State that doesn't come from the server (open sidebar, theme preferences, offline wishlist).

### Drizzle ORM — Relational Persistence
- **What:** Type-safe ORM over PostgreSQL (Supabase). Schema in `src/db/schema/`, singleton client in `src/db/index.ts`.
- **Why:** Drizzle was chosen over Prisma for three reasons:
    1. **Performance:** Native prepared statements, 4.6k req/s in benchmarks, no heavy runtime layer.
    2. **Edge-ready:** Works in edge functions (no Node.js binary requirement).
    3. **Type-safe SQL:** The schema generates TypeScript types that flow into Server Actions and components — no `any` or manual conversion.
- **Pattern:** Tables defined with `pgTable` and `drizzle-orm/pg-core`:
    ```typescript
    export const games = pgTable('games', {
      id: uuid().defaultRandom().primaryKey(),
      cheapsharkId: varchar({ length: 50 }).unique(),
      title: varchar({ length: 255 }).notNull(),
      thumbUrl: varchar({ length: 500 }),
      createdAt: timestamp().defaultNow().notNull(),
      updatedAt: timestamp().defaultNow().notNull(),
    });
    ```
    The client is initialized once in `src/db/index.ts` with `postgres` pool + `drizzle()`. All database operations (ingestion cron, gamification, playlists, wishlist) use this same exported `db`, ensuring connection consistency.

### Data Flow Diagram (Updated)

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                      │
│                                                              │
│  Server                                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  page.tsx (ISR revalidate=3600)                       │   │
│  │    │ fetch() with next: { revalidate }                  │   │
│  │    ▼                                                    │   │
│  │  CheapShark API ── fails? ──► fallbackDeals.ts        │   │
│  │                                                         │   │
│  │  Server Actions (src/actions/*.ts)                      │   │
│  │    ├── Drizzle ORM ──► PostgreSQL (Supabase)           │   │
│  │    ├── fetch() ──► CheapShark API                      │   │
│  │    └── fetch() ──► Typesense Cloud                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
│  Client                                                      │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  TanStack Query v5 (src/hooks/)                       │   │
│  │    ├── Cache, dedup, refetch, optimistic              │   │
│  │    └── Wraps Server Actions for client use            │   │
│  │                                                         │   │
│  │  Zustand (src/store/)                                   │   │
│  │    ├── wishlistStore, authStore, alertStore, uiStore   │   │
│  │    └── Persistence localStorage ↔ Supabase            │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**References:** [ADR-003: State Management](docs/adr/ADR-003-state-management.md), [ADR-001: Tech Stack](docs/adr/ADR-001-tech-stack.md)

## 4. The "T3-ish" System (Modular Architecture)
- **Functional Structuring:** Components like `HistoricalLows` and `EndingSoon` were modularized to contain their own internal fetching and styling. Each section is self-sufficient.
- **Why:** In the previous architecture, we injected `deals` of all types via props into the main component, turning the root into the total data controller. Modularization transferred the 'brain' to each Section. If the New Deals section fails, the Historical Lows section handles its own failure in isolation.

---
**Next Step:** Understand how Server Actions and TanStack Query orchestrate the data flow in module [02. API Infrastructure and Services](02-api-and-services.md).
