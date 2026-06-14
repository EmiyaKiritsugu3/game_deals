# GameDeals: The Absolute Manual & Project Encyclopedia

This directory contains the complete technical, logical, and architectural dissection of the **GameDeals** project. It is designed not just to document "what" the code does, but **"why"** it was written that exact way — serving as the definitive map for recreating or maintaining the system.

> [!IMPORTANT]
> This manual should be read sequentially to ensure infrastructure decisions are understood before dissecting visual components.

## Structural Index

1. **[01. Architecture and Fundamental Decisions](01-architecture-and-decisions.md)**
   The philosophical foundation of the project. Why Next.js 16 with App Router? Why Tailwind CSS v4? State management choices (Zustand + TanStack Query) and persistence (Drizzle ORM + PostgreSQL). How the repository is organized.

2. **[02. API Infrastructure and Services](02-api-and-services.md)**
   Complete data architecture: Server Actions as the primary data layer, TanStack Query for client-side caching and refetching, cron endpoints for scheduled pipelines, and the CheapShark API with resilient fallback and grey market support.

3. **[03. Gamification and State Management](03-gamification-and-state.md)**
   The three state layers: Zustand (global client state with local persistence), TanStack Query (server data cache), and Drizzle ORM (relational persistence). The gamification system with XP, badges, and playlists via Server Actions and PostgreSQL.

4. **[04. Routing and Pages (App Router)](04-pages-routing.md)**
   Root layout and its slots (modal, SyncManager), loading states with Suspense, Home Page request parallelization with `Promise.all`, and the Intercepting Routes pattern for overlaid modals with static route fallback.

5. **[05. Core UI Components](05-core-components.md)**
   Logical block dissection of base components: `GameCard` with micro-interactions (wishlist, alerts, playlists), `HeroSection` with Tailwind CSS v4 and dynamic carousel, `Navbar` with reactive search and session, and authentication modals.

6. **[06. Feature Components](06-feature-components.md)**
   Dissection of self-sufficient components: `HistoricalLows` with historical price detection, `ActivityFeed` reactive to gamification, `DynamicCharts` with lazy loading via `next/dynamic`, and `Freebies` with empty state handling.

---
*Manual generated and versioned directly alongside the source code.*
