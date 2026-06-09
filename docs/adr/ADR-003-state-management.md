# ADR-003: State Management — Zustand + SWR

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals precisa gerenciar dois tipos de estado distintos:

1. **Client-side global state**: Wishlist, auth status, price alerts, user preferences, UI state (modals, toasts)
2. **Server-state / Data fetching**: Deals, game details, search results, price history — dados que vêm da API e precisam revalidação, cache, dedup

Anteriormente usava-se apenas React Context + useState, o que causava:
- Re-renders desnecessários em componentes não relacionados
- Falta de persistência automática (localStorage manual)
- Boilerplate para async data fetching (loading, error, retry)

## Decisão

### Zustand — Global Client State

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

### SWR — Server State / Data Fetching

```typescript
// src/hooks/useDeals.ts
const { data, error, isLoading, mutate } = useSWR('/api/deals', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 30000,      // 30s dedup
  refreshInterval: 300000,      // 5min background refresh
  fallbackData: fallbackDeals,  // instant paint
})
```

**Use cases**:
- Home page deals (Historical Lows, Ending Soon, Hero)
- Search dropdown no Navbar (real-time, debounced)
- Game details no Sidebar Modal
- Price history charts
- Bundles page, Collections page

**Por que não React Query / RTK Query?**
- SWR: Next.js native feel, built-in dedup/focus revalidation, menor bundle, `fallbackData` para instant loading

## Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                         │
├─────────────────────────────────────────────────────────────┤
│  Server Components (page.tsx, HistoricalLows, EndingSoon)   │
│    │                                                         │
│    ▼ fetch() com next/cache (revalidate: 300)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           src/services/api.ts (CheapShark + IGDB)    │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Client Components (Navbar, Search, SidebarModal, Wishlist) │
│    │                                                         │
│    ▼ SWR hooks                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SWR Cache (dedup, revalidate)           │    │
│  └─────────────────────────────────────────────────────┘    │
│    │                                                         │
│    ▼ Zustand Stores                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  wishlistStore, authStore, alertStore, uiStore       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Consequências

### Positivas
- **Separação clara**: Server state (SWR) ≠ Client state (Zustand)
- **Performance**: SWR dedup evita requests duplicados; Zustand subscribers granulares evitam re-renders
- **Persistência trivial**: `persist` middleware = localStorage automático
- **TypeScript**: Ambos com inferência excelente
- **SSR-friendly**: Server Components fazem fetch inicial; SWR hidrata no client

### Negativas / Trade-offs
- **Duas libs de estado**: Curva de aprendizado para novos devs (mitigado: documentação em `tech_stack_dictionary.md`)
- **Hidratação**: Cuidado com mismatch server/client (use `suppressHydrationWarning` onde necessário)
- **Supabase sync futuro**: Precisará de middleware para sync Zustand → Supabase on login (Phase 12d)

---

## Referências
- [Tech Stack Dictionary](../tech_stack_dictionary.md#-state-management--data-fetching)
- `src/store/` — implementação dos stores
- `src/hooks/` — hooks SWR customizados