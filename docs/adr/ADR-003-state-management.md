# ADR-003: State Management — Zustand + TanStack Query v5 + Server Actions

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals needs to manage three distinct state types:

1. **Client-side global state**: Wishlist, auth status, price alerts, user preferences, UI state (modals, toasts, sidebar)
2. **Server-state / Data fetching**: Deals, game details, search results, price history — data that comes from the API and needs revalidation, cache, dedup, optimistic updates
3. **Server mutations / Actions**: Form submissions, playlist creation, affiliate clicks, price alert creation — mutations that run on the server

Previously SWR was used for server state. With Next.js 16 and React 19, **Server Actions + `use cache`** cover 60% of data fetching and simple mutation cases, while **TanStack Query v5** remains superior for complex cases.

---

## Decision

### Zustand — Global Client State (Unchanged)

```typescript
// src/store/wishlistStore.ts
create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (game) => set({ items: [...get().items, game] }),
      remove: (id) => set({ items: get().items.filter(g => g.id !== id) }),
    }),
    { name: 'gamedeals-wishlist' } // localStorage auto
  )
)
```

**Use cases**:
- Wishlist (persisted in localStorage, later sync with Supabase)
- Auth state (user, session, hydration)
- Price alerts (threshold, notification preferences)
- UI state: sidebar open/closed, toasts, modals
- Gamification: XP, earned badges (local cache)

**Why not Redux/Recoil/Jotai?**
- Zustand: ~1KB, TypeScript-first, minimal API, native `persist` middleware, no providers

---

### TanStack Query v5 — Server State / Complex Data Fetching

```typescript
// src/hooks/useDeals.ts
import { useQuery } from '@tanstack/react-query';

const { data, error, isLoading, mutate } = useQuery({
  queryKey: ['deals', { region: 'BR', sort: 'dealRating' }],
  queryFn: () => fetchDeals({ region: 'BR', sort: 'dealRating' }),
  staleTime: 60_000,           // 1 min
  refetchOnWindowFocus: false, // Next.js 16: Server Actions handle revalidation
  placeholderData: fallbackDeals, // instant paint
});
```

**Use cases**:
- Home page deals (Historical Lows, Ending Soon, Hero) — **Server Components + `use cache`** for initial load, TanStack Query for client-side interactions
- Search dropdown in Navbar (real-time, debounced, infinite scroll)
- Game details in Sidebar Modal (dependent queries: game → prices → history → HLTB)
- Price history charts (paginated queries, background refetch)
- Bundles page, Collections page (infinite queries)

**Why not SWR / React Query v4?**
- TanStack Query v5: **Network Mode** (online/offline), **Persisted Query Client**, **native Query Cancellation**, **improved Optimistic Updates API**, **Server Components integration** via `dehydrate`/`hydrate`
- SWR: Maintenance mode; TanStack Query is the 2026 industry standard

---

### Server Actions + `fetch` — Simple Data Fetching & Mutations (New 2026)

```typescript
// src/actions/games.ts
'use server';

export async function getGame(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}`, {
    next: { revalidate: 300, tags: [`game-${id}`] },
  });
  if (!res.ok) throw new Error('Failed to fetch game');
  return res.json();
}

// Mutation via Server Action
export async function createPlaylistAction(formData: FormData) {
  const userId = (await getUser()).id;
  const title = formData.get('title') as string;
  
  const [playlist] = await drizzle.insert(playlists).values({
    userId, title, slug: slugify(title), gameIds: []
  }).returning();
  
  revalidatePath(`/user/${userId}/playlists`);
  return playlist;
}
```

**Use cases**:
- **Initial data fetching** in Server Components (SSR/ISR/PPR) — replaces `getServerSideProps`/`getStaticProps`
- **Simple mutations**: create playlist, add to wishlist, create price alert, affiliate click logging
- **On-demand revalidation**: `revalidatePath`, `revalidateTag` after mutations
- **Form handling**: `<form action={createPlaylistAction}>` — native progressive enhancement

**Why Server Actions?**
- Next.js 16: **Stable, performant, type-safe** (shares types with client)
- Eliminates API routes for simple mutations
- Works with progressive enhancement (JS disabled → form still works)
- Integrated with `use cache` for automatic ISR

---

## Updated Data Architecture (2026)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router                         │
├─────────────────────────────────────────────────────────────────────┤
│  Server Components (page.tsx, HistoricalLows, EndingSoon)           │
│    │                                                                 │
│    ▼ fetch() com next/cache (revalidate: 300) + use cache           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │           src/actions/*.ts (Server Actions)          │            │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │            │
│  │  │ Drizzle ORM │  │ Supabase    │  │ Typesense   │   │            │
│  │  │ (PostgreSQL)│  │ (Auth/RT)   │  │ (Search)    │   │            │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │            │
│  └─────────────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│  Client Components (Navbar, Search, SidebarModal, Wishlist)         │
│    │                                                                 │
│    ▼ TanStack Query v5 hooks                                         │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              TanStack Query Cache                    │            │
│  │  (dedup, background refetch, optimistic, persist)   │            │
│  └─────────────────────────────────────────────────────┘            │
│    │                                                                 │
│    ▼ Zustand Stores                                                  │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  wishlistStore, authStore, alertStore, uiStore       │            │
│  └─────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### Responsibility Division (2026)

| Scenario | Technology | Example |
|---------|------------|---------|
| **Initial page load (SEO)** | Server Component + `use cache` | `page.tsx` → `getDeals()` cached 5min |
| **Client navigation** | TanStack Query | Navbar search → `useQuery(['search', q])` |
| **Infinite scroll** | TanStack Query `useInfiniteQuery` | `/deals` page pagination |
| **Dependent queries** | TanStack Query `enabled` | Game modal: game → prices → history |
| **Optimistic updates** | TanStack Query `onMutate` | Add to wishlist → instant UI update |
| **Form submit (simple)** | Server Action | `<form action={createPlaylistAction}>` |
| **Form submit (complex)** | TanStack Query `useMutation` | Multi-step checkout, file upload |
| **Client-only state** | Zustand | Sidebar open, toast queue, theme |
| **Persisted client state** | Zustand `persist` | Wishlist localStorage → Supabase sync |

---

## Consequences

### Positive
- **Clear separation**: Server state (TanStack Query + Server Actions) ≠ Client state (Zustand)
- **Performance**: Server Components for initial load (zero JS), TanStack Query for interactivity
- **Type safety**: Drizzle types → Server Actions → TanStack Query → Components
- **Native SSR/ISR/PPR**: Next.js 16 cache semantics + `use cache` + `revalidateTag`
- **Progressive Enhancement**: Server Actions work without JS
- **Optimized bundle**: Server Actions don't go to client bundle

### Negative / Trade-offs
- **Three paradigms**: Server Components, Server Actions, TanStack Query — learning curve
- **Hydration**: Watch for server/client mismatch (use `suppressHydrationWarning` where needed)
- **Cache invalidation**: `revalidateTag`/`revalidatePath` requires discipline (mitigated: standardized tags)
- **Future Supabase sync**: Will need middleware to sync Zustand → Supabase on login (Phase 12d)

---

## References
- [TanStack Query v5 Docs](https://tanstack.com/query/v5/docs/framework/react/overview) — Network Mode, Persisted Client, Optimistic Updates
- [Next.js 16 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — Stable in Next.js 16
- [Next.js fetch with revalidate](https://nextjs.org/docs/app/building-your-application/caching) — Programmatic ISR
- [Tech Stack Dictionary](../tech_stack_dictionary.md#-state-management--data-fetching)
- `src/store/` — Zustand store implementations
- `src/hooks/` — Custom TanStack Query hooks
- `src/actions/` — Server Actions for mutations and data fetching