# 03. Gamificação e Gerenciamento de Estado

GameDeals usa três camadas de estado distintas: **Zustand** para estado global do cliente, **TanStack Query** para dados de servidor e cache no cliente, e **Server Actions** + **Drizzle ORM** para mutations e persistência. Cada camada tem responsabilidade bem definida.

---

## 1. Zustand — Estado Global do Cliente

Zustand (~1 KB, zero boilerplate, sem providers) substitui Context API e Redux. Três stores independentes, cada uma num arquivo separado em `src/store/`.

### authStore.ts (`src/store/authStore.ts`)

Gerencia sessão do usuário. **Lazy-init** do Supabase browser client pra evitar crash SSR — o cliente só é carregado via `import()` dinâmico dentro de `getSupabase()`.

```typescript
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (supabaseUser: SupabaseUser | null) => void;
  logout: () => Promise<void>;
}
```

- `setUser()` mapeia `SupabaseUser` → `User` local (id, name, email, avatar com fallback DiceBear).
- `logout()` chama `supabase.auth.signOut()` e limpa o estado.
- Sem `persist` middleware — sessão é recarregada do SSR no mount via `useEffect` no Navbar + `onAuthStateChange`.

### wishlistStore.ts (`src/store/wishlistStore.ts`)

Array de IDs (`string[]`) persistido no **localStorage** via `persist` middleware do Zustand (chave: `gameDeals_wishlist`).

```typescript
interface WishlistState {
  wishlist: string[];
  addToWishlist: (gameID: string) => void;
  removeFromWishlist: (gameID: string) => void;
  toggleWishlist: (gameID: string) => void;
  isInWishlist: (gameID: string) => boolean;
  setWishlist: (ids: string[]) => void;
}
```

- Operações são **locais** (sem fetch). Sincronização com Supabase acontece posteriormente via `setWishlist()`.
- `addToWishlist` previne duplicatas com `includes()` antes de adicionar.
- `removeFromWishlist` filtra pelo ID.
- `toggleWishlist` combina add/remove num só método pra uso em botões toggle.

### alertStore.ts (`src/store/alertStore.ts`)

Alertas de preço com `persist` middleware (chave: `gamedeals-alerts-storage`).

```typescript
interface PriceAlert {
  gameID: string;
  gameTitle: string;
  targetPrice: number;
  currentPrice: number;
  isKeyshopAllowed: boolean;
  createdAt: number;
}

interface AlertState {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'createdAt'>) => void;
  removeAlert: (gameID: string) => void;
  hasAlert: (gameID: string) => boolean;
  getAlert: (gameID: string) => PriceAlert | undefined;
}
```

- `addAlert` atualiza se existente ou insere novo (com `createdAt: Date.now()`).
- Alertas persistidos são verificados pelo cron `/api/cron/check-alerts`.

### Por que Zustand?

| Alternativa | Problema |
|-------------|----------|
| Context API | Re-renderizações em cascata sem `useMemo` rigoroso |
| Redux | Boilerplate excessivo para necessidades simples |
| Jotai/Recoil | API mais complexa, ecossistema menor |

Zustand: stores isoladas, `persist` middleware nativo, TypeScript-first, ~1KB.

---

## 2. TanStack Query — Dados de Servidor no Cliente

**Server state** (deals, preços, histórico) não vai pra Zustand. Usa-se **TanStack Query v5** com hooks em `src/hooks/`.

### useWishlistGames (`src/hooks/useWishlistGames.ts`)

Busca detalhes dos jogos na wishlist via CheapShark API.

```typescript
export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async () => {
      const stores = await getStores();
      const games = await Promise.all(
        gameIds.map((id) => getGame(id).catch(() => null))
      );
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

- `enabled: gameIds.length > 0` — não dispara query com lista vazia.
- `catch(() => null)` — jogo offline não quebra a lista inteira.
- `staleTime: 5 min` — evita refetch em navegação rápida.

### usePriceHistory (`src/hooks/usePriceHistory.ts`)

Dois hooks — `useDailyPriceHistory` e `useWeeklyPriceHistory` — que chamam **Server Actions** (`getDailyPriceHistoryAction`, `getWeeklyPriceHistoryAction`).

```typescript
export function useDailyPriceHistory(gameId: string | null, days = 90) {
  return useQuery({
    queryKey: ['priceHistory', 'daily', gameId, days],
    queryFn: () => getDailyPriceHistoryAction(gameId ?? '', days),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,     // 1 hora
    gcTime: 24 * 60 * 60 * 1000,   // GC após 24h
  });
}
```

### Divisão de Responsabilidade

| Cenário | Tecnologia | Local |
|---------|------------|-------|
| Estado global do cliente | Zustand | `src/store/` |
| Cache de dados do servidor | TanStack Query | `src/hooks/` |
| Mutations e persistência | Server Actions | `src/actions/` |
| Schema type-safe | Drizzle ORM | `src/db/schema/` |

---

## 3. Gamificação — Drizzle + Server Actions

Sistema de gamificação usa **Drizzle ORM** para schema e **Server Actions** (`'use server'`) para lógica de negócio. Substitui o antigo serviço `src/services/social.ts` que chamava Supabase client diretamente.

### Schema Drizzle (`src/db/schema/gamification.ts`)

Quatro tabelas:

```typescript
// Badges disponíveis no sistema
export const badges = pgTable('badges', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
  iconSvg: text().notNull(),
  rarity: varchar({ length: 20 }).default('Common'),
  criteria: jsonb().notNull(), // { type: "wishlist_count", threshold: 10 }
});

// Badges conquistadas por usuário (unique index evita duplicatas)
export const userBadges = pgTable('user_badges', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  badgeId: uuid().notNull(),
  awardedAt: timestamp().defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_badges_user_badge_unique').on(table.userId, table.badgeId),
]);

// Histórico de atividades do usuário
export const activities = pgTable('activities', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  actionType: varchar({ length: 50 }).notNull(),
  details: jsonb(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Wishlist persistida (relacional, por usuário)
export const wishlists = pgTable('wishlists', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  gameId: uuid().notNull(),
  addedAt: timestamp().defaultNow().notNull(),
}, (table) => [
  uniqueIndex('wishlists_user_game_unique').on(table.userId, table.gameId),
]);
```

Princípios:
- `snake_case` nas colunas PostgreSQL (convensão do projeto).
- `uuid().defaultRandom()` para PKs.
- `uniqueIndex` para constraints de unicidade (badge por usuário, jogo por wishlist).
- `jsonb()` para `criteria` e `details` — flexível, sem schema rígido.
- `ON CONFLICT DO NOTHING` nas inserções via raw SQL.

### Server Actions (`src/actions/gamification.ts`)

Operações usando `db.execute(sql\`...\`)` com Drizzle + PostgreSQL raw queries.

| Action | Descrição |
|--------|-----------|
| `addXPAction(userId, amount, reason)` | Adiciona XP ao perfil + registra atividade |
| `getUserXPAction(userId)` | Retorna XP total do usuário |
| `getBadgesAction()` | Lista todos os badges disponíveis |
| `getUserBadgesAction(userId)` | Badges do usuário com JOIN e `awardedAt` |
| `awardBadgeAction(userId, badgeId)` | Concede badge, ignora duplicata (ON CONFLICT DO NOTHING) |
| `checkAndAwardBadgesAction(userId)` | Verifica métricas e concede badges automáticos |

**Fluxo de `addXPAction`:**
1. `INSERT INTO profiles ... ON CONFLICT (id) DO UPDATE SET xp = xp + amount` — upsert atômico.
2. `INSERT INTO activities` — log da ação.
3. Sem transação explícita (cada statement é atômico no PostgreSQL).

**Fluxo de `checkAndAwardBadgesAction`:**
1. Busca XP, contagem de wishlists, contagem de playlists.
2. Para cada badge (First Steps, XP Hunter, Wishlist Master, Curator), verifica threshold.
3. Chama `awardBadgeAction` que usa `ON CONFLICT (userId, badgeId) DO NOTHING` — badge já existente é ignorado silenciosamente.
4. Retorna `true` independente de quantos badges foram concedidos.

### Sistema de Playlists (`src/actions/playlists.ts` + `src/db/schema/playlists.ts`)

Playlists usam **duas tabelas** relacionais (não array de strings):

```typescript
export const playlists = pgTable('playlists', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  isPublic: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const playlistGames = pgTable('playlist_games', {
  id: uuid().defaultRandom().primaryKey(),
  playlistId: uuid().notNull().references(() => playlists.id),
  gameId: uuid().notNull(),
  notes: varchar({ length: 500 }),
  addedAt: timestamp().defaultNow().notNull(),
});
```

Server Actions de playlist (`src/actions/playlists.ts`):
- `createPlaylistAction(title, description, isPublic)` — gera slug, insere, retorna playlist.
- `getUserPlaylistsAction()` — lista playlists do usuário com `LEFT JOIN COUNT(gameCount)`.
- `addGameToPlaylistAction(playlistId, gameId, notes)` — verifica ownership antes de inserir.
- `removeGameFromPlaylistAction(playlistId, gameId)` — verifica ownership antes de deletar.
- `deletePlaylistAction(playlistId)` — verifica ownership.
- `getPublicPlaylistAction(slug)` — busca playlist pública + JOIN com `games` pra dados completos.

Todas as actions de playlist usam `postgres` raw client (não Drizzle ORM) com `ON CONFLICT DO NOTHING` para evitar duplicatas.

### Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                  │
├─────────────────────────────────────────────────────────┤
│  Server Components (page.tsx, layouts)                    │
│    │ fetch() + revalidate tags + use cache (ISR)         │
│    ▼                                                     │
│  src/actions/*.ts (Server Actions)                        │
│    ├── gamification.ts  → db.execute(sql`...`)           │
│    └── playlists.ts     → postgres raw queries           │
│    │                                                      │
│    ▼ Drizzle ORM / Raw SQL                               │
│  PostgreSQL (Supabase)                                    │
│    ├── badges, user_badges, activities, wishlists        │
│    ├── playlists, playlist_games                         │
│    └── profiles (xp column)                              │
├─────────────────────────────────────────────────────────┤
│  Client Components (Navbar, Wishlist, Charts)            │
│    │                                                      │
│    ▼ TanStack Query v5 hooks                             │
│    ├── useWishlistGames → api.ts (CheapShark)            │
│    └── usePriceHistory → server actions (Drizzle)        │
│    │                                                      │
│    ▼ Zustand stores (src/store/)                         │
│    ├── authStore.ts     → sessão + lazy Supabase init    │
│    ├── wishlistStore.ts → localStorage persist           │
│    └── alertStore.ts    → price alerts persist           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Fluxo Típico de Gamificação

1. Usuário adiciona jogo na wishlist → `wishlistStore.addToWishlist(id)` (instantâneo, local).
2. TanStack Query `useWishlistGames` detecta novo ID e faz fetch dos detalhes.
3. Quando usuário faz login, wishlist local é sincronizada com Supabase via `wishlists` table.
4. Server Action `addXPAction` é chamada, incrementando XP no perfil.
5. `checkAndAwardBadgesAction` varre métricas e concede badges automaticamente.
6. Badges são visíveis via `getUserBadgesAction` (JOIN badges + user_badges).

---

**Próximo Passo:** Veja como as engrenagens de UI sustentam tudo isso em [04. Roteamento e Páginas (App Router)](04-pages-routing.md).
