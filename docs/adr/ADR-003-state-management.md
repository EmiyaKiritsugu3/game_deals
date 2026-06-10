# ADR-003: State Management — Zustand + TanStack Query v5 + Server Actions

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals precisa gerenciar três tipos de estado distintos:

1. **Client-side global state**: Wishlist, auth status, price alerts, user preferences, UI state (modals, toasts, sidebar)
2. **Server-state / Data fetching**: Deals, game details, search results, price history — dados que vêm da API e precisam revalidação, cache, dedup, optimistic updates
3. **Server mutations / Actions**: Form submissions, playlist creation, affiliate clicks, price alert creation — mutations que rodam no servidor

Anteriormente usava-se SWR para server state. Com Next.js 16 e React 19, **Server Actions + `use cache`** cobrem 60% dos casos de data fetching e mutations simples, enquanto **TanStack Query v5** permanece superior para casos complexos.

---

## Decisão

### Zustand — Global Client State (Inalterado)

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
- Wishlist (persistida no localStorage, sync posterior com Supabase)
- Auth state (user, session, hydration)
- Price alerts (threshold, notification preferences)
- UI state: sidebar open/closed, toasts, modais
- Gamificação: XP, badges conquistados (cache local)

**Por que não Redux/Recoil/Jotai?**
- Zustand: ~1KB, TypeScript-first, API minimalista, `persist` middleware nativo, sem providers

---

### TanStack Query v5 — Server State / Data Fetching Complexo

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
- Home page deals (Historical Lows, Ending Soon, Hero) — **Server Components + `use cache`** para initial load, TanStack Query para client-side interactions
- Search dropdown no Navbar (real-time, debounced, infinite scroll)
- Game details no Sidebar Modal (dependent queries: game → prices → history → HLTB)
- Price history charts (paginated queries, background refetch)
- Bundles page, Collections page (infinite queries)

**Por que não SWR / React Query v4?**
- TanStack Query v5: **Network Mode** (online/offline), **Persisted Query Client**, **Query Cancellation** nativo, **Optimistic Updates** API melhorada, **Server Components integration** via `dehydrate`/`hydrate`
- SWR: Em modo manutenção; TanStack Query é padrão da indústria 2026

---

### Server Actions + `use cache` — Data Fetching & Mutations Simples (Novo 2026)

```typescript
// src/actions/games.ts
'use server';

import { unstable_cache as useCache } from 'next/cache';
import { drizzle } from '@/db';
import { games, prices } from '@/db/schema';

export const getGame = useCache(
  async (id: string) => {
    const game = await drizzle.query.games.findFirst({
      where: eq(games.id, id),
      with: { prices: true, history: true },
    });
    return game;
  },
  ['game', id],
  { revalidate: 300, tags: ['game', id] } // ISR 5min + on-demand revalidation
);

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
- **Initial data fetching** em Server Components (SSR/ISR/PPR) — substitui `getServerSideProps`/`getStaticProps`
- **Mutations simples**: create playlist, add to wishlist, create price alert, affiliate click logging
- **On-demand revalidation**: `revalidatePath`, `revalidateTag` após mutations
- **Form handling**: `<form action={createPlaylistAction}>` — progressive enhancement nativo

**Por que Server Actions?**
- Next.js 16: **Stable, performático, type-safe** (compartilha types com client)
- Elimina API routes para mutations simples
- Funciona com progressive enhancement (JS disabled → form ainda funciona)
- Integrado com `use cache` para ISR automático

---

## Arquitetura de Dados Atualizada (2026)

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

### Divisão de Responsabilidades (2026)

| Cenário | Tecnologia | Exemplo |
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

## Consequências

### Positivas
- **Separação clara**: Server state (TanStack Query + Server Actions) ≠ Client state (Zustand)
- **Performance**: Server Components para initial load (zero JS), TanStack Query para interatividade
- **Type safety**: Drizzle types → Server Actions → TanStack Query → Components
- **SSR/ISR/PPR nativo**: Next.js 16 cache semantics + `use cache` + `revalidateTag`
- **Progressive Enhancement**: Server Actions funcionam sem JS
- **Bundle otimizado**: Server Actions não vão para client bundle

### Negativas / Trade-offs
- **Três paradigmas**: Server Components, Server Actions, TanStack Query — curva de aprendizado
- **Hidratação**: Cuidado com mismatch server/client (use `suppressHydrationWarning` onde necessário)
- **Cache invalidation**: `revalidateTag`/`revalidatePath` requer disciplina (mitigado: tags padronizadas)
- **Supabase sync futuro**: Precisará de middleware para sync Zustand → Supabase on login (Phase 12d)

---

## Referências
- [TanStack Query v5 Docs](https://tanstack.com/query/v5/docs/framework/react/overview) — Network Mode, Persisted Client, Optimistic Updates
- [Next.js 16 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — Stable em Next.js 16
- [Next.js `use cache`](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) — ISR programático
- [Tech Stack Dictionary](../tech_stack_dictionary.md#-state-management--data-fetching)
- `src/store/` — implementação dos stores Zustand
- `src/hooks/` — hooks TanStack Query customizados
- `src/actions/` — Server Actions para mutations e data fetching