# 🌐 02. Infraestrutura de API e Serviços

Esta seção detalha como o GameDeals se comunica com o mundo exterior. A fundação de dados do projeto repousa sobre três pilares: **Server Actions** (camada primária de dados), **TanStack Query** (caching e refetch no cliente) e **cron endpoints** (pipeline de dados agendado).

---

## 1. Visão Geral da Arquitetura de Dados

O fluxo de dados segue uma hierarquia clara:

```
CheapShark API (externa)
       │
       ▼
┌─────────────────────────────┐
│  Server Actions (src/actions/) │  ← 'use server', camada primária
│  - deals.ts                  │
│  - search.ts                 │
│  - alerts.ts                 │
│  - playlists.ts              │
│  - gamification.ts           │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│ TanStack│ │ Postgres │
│  Query  │ │ (Drizzle │
│  Hooks  │ │  + raw)  │
└────┬────┘ └──────────┘
     ▼
  Componentes React (cliente)
```

- **Server Components** chamam Server Actions diretamente em server-only contexts.
- **Client Components** usam TanStack Query hooks que invocam Server Actions.
- **Cron endpoints** (`/api/cron/*`) disparam Server Actions em segundo plano num schedule fixo.

---

## 2. CheapShark API (`src/services/api.ts`)

O núcleo do GameDeals é alimentado pela API da CheapShark. O cliente raw em `src/services/api.ts` faz chamadas `fetch` diretas com opções de cache do Next.js.

### Estratégia de Caching (`revalidate`)

- **`getDeals()`** — `revalidate: 3600` (1 hora). Listagens de ofertas mudam com frequência moderada.
- **`getStores()`** — `revalidate: 86400` (24 horas). Lojas raramente mudam.
- **`getGame()`** — `revalidate: 3600` (1 hora). Detalhes de jogo individual.

**O Porquê:** A API da CheapShark é rigorosa contra spam. Sem cache agressivo do Next.js, acessos simultâneos de centenas de usuários causariam bloqueio do IP do servidor (HTTP 429). O cache blindia a API externa.

### Fallback Resiliênte

- `getDeals()` envolvido em `try/catch`. Se `res.ok` falhar, retorna `fallbackDeals` (constante local em `src/data/`). A UI renderiza dados antigos pacificamente — sem White Screen of Death.
- `getGame()` retorna `null` em caso de erro; o componente lida com estado vazio.

### Grey Markets

Lojas não-oficiais (Keyshops: Kinguin, Eneba, CDKeys, Gamivo) não são retornadas nativamente pela CheapShark. Em `api.ts`, a heurística `isGreyMarketStore()` mapeia lojas com ID >= 100. A função `generateGreyMarketDeals()` as injeta nas páginas de detalhe para comparação total de preços.

### DRM e Lojas

`getDrmType()` classifica lojas por tipo de DRM:

| Loja | DRM |
|------|-----|
| GOG | DRM-Free |
| Epic | Epic Key |
| Origin/EA | EA App |
| Microsoft | MS Store |
| Steam | Steam Key |

---

## 3. Server Actions (`src/actions/`) — Camada Primária

Toda a lógica de dados que requer autenticação, acesso a banco ou validação vive em Server Actions (`'use server'`). Elas substituem APIs route handlers tradicionais como camada de dados principal.

### `deals.ts`

Funções de busca e ingestão de ofertas:

| Função | Descrição |
|--------|-----------|
| `getDealsAction(params?)` | Busca deals da CheapShark com validação de parâmetros (sortBy, pageSize, upperPrice, etc). Fallback para `fallbackDeals`. |
| `getGameAction(id)` | Detalhes de um jogo via CheapShark. |
| `getStoresAction()` | Lista de lojas com grey markets injetados. |
| `ingestPricesAction()` | Pipeline de ingestão: busca 100 deals da CheapShark, faz upsert em `games`, insere em `deals` e `price_history` (lotes de 50). |
| `getDailyPriceHistoryAction(gameId, days)` | Histórico diário via função PostgreSQL `get_daily_prices()`. |
| `getWeeklyPriceHistoryAction(gameId, weeks)` | Histórico semanal via função PostgreSQL `get_weekly_prices()`. |
| `getDealsFromDBAction(limit)` | Deals do banco com JOIN em `games`. |

### `search.ts`

Busca com fallback Typesense → CheapShark:

| Função | Descrição |
|--------|-----------|
| `searchGamesAction(query, limit)` | Tenta Typesense primeiro; se não configurado, fallback para CheapShark `/api/1.0/games`. |
| `syncGamesToTypesenseAction()` | Sincroniza 100 melhores deals do CheapShark para Typesense. Chamado pelo cron. |
| `createTypesenseCollectionAction()` | Setup inicial da collection Typesense (idempotente). |

### `alerts.ts`

Alertas de preço com autenticação e raw `postgres`:

| Função | Descrição |
|--------|-----------|
| `createPriceAlertAction(gameId, targetPrice, storeId?)` | Cria alerta. Verifica auth via Supabase. Usa `ON CONFLICT` para upsert. |
| `getUserAlertsAction()` | Lista alertas do usuário logado com JOIN em `games`. |
| `deletePriceAlertAction(alertId)` | Remove alerta com verificação de ownership. |
| `checkTriggeredAlertsAction()` | Compara preços atuais com target dos alerts. Usado pelo cron. |

### `playlists.ts`

Playlists com ownership check:

| Função | Descrição |
|--------|-----------|
| `createPlaylistAction(title, description, isPublic)` | Cria playlist com slug automático. |
| `getUserPlaylistsAction()` | Lista playlists com contagem de jogos. |
| `addGameToPlaylistAction(playlistId, gameId, notes?)` | Adiciona jogo com verificação de ownership. |
| `removeGameFromPlaylistAction(playlistId, gameId)` | Remove jogo. |
| `deletePlaylistAction(playlistId)` | Deleta playlist. |
| `getPublicPlaylistAction(slug)` | Busca playlist pública por slug. |

### `gamification.ts`

Sistema de XP e badges:

| Função | Descrição |
|--------|-----------|
| `addXPAction(userId, amount, reason)` | Adiciona XP e registra atividade. |
| `getUserXPAction(userId)` | Consulta XP atual. |
| `getBadgesAction()` | Lista todos os badges. |
| `getUserBadgesAction(userId)` | Badges conquistados pelo usuário. |
| `awardBadgeAction(userId, badgeId)` | Concede badge (idempotente). |
| `checkAndAwardBadgesAction(userId)` | Verifica condições e concede badges automáticos (First Steps, XP Hunter, Wishlist Master, Curator). |

### Padrão de Autenticação em Server Actions

Toda ação que modifica dados do usuário segue o mesmo padrão:

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';

export async function someProtectedAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // ... lógica protegida
}
```

---

## 4. TanStack Query Hooks (`src/hooks/`)

Os hooks do TanStack Query são a ponte entre Server Actions e componentes React no cliente. Eles gerenciam estados de loading, cache e refetch automático.

### `useWishlistGames.ts`

```typescript
export function useWishlistGames(gameIds: string[]) {
  return useQuery({
    queryKey: ['wishlist-games', ...gameIds],
    queryFn: async () => {
      const stores = await getStores();
      const games = await Promise.all(gameIds.map((id) => getGame(id)));
      return { stores, games };
    },
    enabled: gameIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

- Busca stores + games em paralelo.
- `enabled: gameIds.length > 0` evita fetch desnecessário.
- `staleTime: 5min` reduz refetch em navegação rápida.

### `usePriceHistory.ts`

Dois hooks para histórico de preços:

```typescript
// Diário — 90 dias
export function useDailyPriceHistory(gameId: string | null, days = 90)

// Semanal — 26 semanas
export function useWeeklyPriceHistory(gameId: string | null, weeks = 26)
```

- Chamam `getDailyPriceHistoryAction` / `getWeeklyPriceHistoryAction` (Server Actions).
- `enabled: !!gameId` — só executa com ID válido.
- `staleTime: 1h` — dados históricos mudam uma vez por dia (via cron).
- `gcTime: 24h` — mantém cache mesmo após desmontagem do componente.

---

## 5. Cron Endpoints (`src/app/api/cron/`)

Três endpoints agendados no Vercel Cron Jobs. Todos protegidos por `CRON_SECRET` via header `Authorization: Bearer <token>`.

### `ingest-prices` (a cada 4h)

```
GET /api/cron/ingest-prices
```

1. Valida `CRON_SECRET`.
2. Chama `ingestPricesAction()` — busca 100 deals do CheapShark, faz upsert de games, insere deals + price_history em lotes de 50.
3. Retorna métricas: `dealsIngested`, `gamesUpserted`, `pricesRecorded`.
4. Status 500 em caso de falha.

### `reindex-typesense` (diário)

```
GET /api/cron/reindex-typesense
```

1. Valida `CRON_SECRET`.
2. Chama `syncGamesToTypesenseAction()` — busca 100 deals, mapeia para schema Typesense, faz index batch.
3. Retorna `indexed: number`.

### `check-alerts` (a cada 30min)

```
GET /api/cron/check-alerts
```

1. Valida `CRON_SECRET`.
2. Busca todos `price_alerts` ativos via Supabase client.
3. Para cada `gameId` único, consulta CheapShark API `/games?id=` para preço atual.
4. Atualiza `currentPrice` na tabela.
5. Loga alertas disparados (preço atual <= targetPrice).
6. Retorna `{ processed, triggered, details }`.

### Padrão de Proteção

Todos os cron endpoints seguem o mesmo padrão:

```typescript
const authHeader = request.headers.get('authorization');
if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

A variável `CRON_SECRET` é configurada no Vercel Dashboard + GitHub Secrets.

---

## 6. Acesso a Banco de Dados: Drizzle ORM + raw postgres

O projeto usa **dois padrões de acesso a banco**, cada um com seu propósito.

### Drizzle ORM (padrão principal)

**Singleton** em `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(dbUrl);
export const db = drizzle({ client: queryClient });
```

Usado para:

- Queries com type safety e schema definitions (`src/db/schema/`).
- INSERT/UPDATE com `ON CONFLICT` (`ingestPricesAction`).
- SELECT com JOIN entre tabelas (`getDealsFromDBAction`).
- Chamada a funções PostgreSQL via `sql` tagged template (`getDailyPriceHistoryAction`).

### Raw `postgres` client (operações específicas)

Em `alerts.ts` e `playlists.ts`, o client `postgres` é importado diretamente:

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });
```

Usado para:

- Queries com colunas snake_case (padrão do Supabase) que o schema Drizzle não cobre.
- `price_alerts`, `playlists`, `playlist_games` — tabelas que usam `userId`, `gameId` (camelCase nas colunas SQL).
- Operações que exigem `ON CONFLICT` com retorno completo via `RETURNING *`.
- `connect_timeout: 5` evita hangs em ambientes serverless.

**Por que dois padrões?** O schema Drizzle usa snake_case (`game_id`, `store_id`), mas tabelas legadas no Supabase usam camelCase (`userId`, `gameId`). Para evitar conflito de naming, as ações que acessam tabelas camelCase usam raw `postgres` diretamente.

---

## 7. Scraping Acessório (`src/services/hltb.ts`)

- **O Porquê:** A CheapShark não provê dados de tempo estimado de zeramento. Construímos um mini scraper para o HowLongToBeat.
- **Limitações:** Por ser web scraper, é suscetível a mudanças no HTML do site-alvo. O serviço é encapsulado puramente na Game Details Page, longe da Home, para não comprometer a Performance Inicial (FCP).
- Testes em `src/services/hltb.test.ts`.

---

## 8. Rate Limit e Resiliência: Estratégias de Fallback

A CheapShark API impõe rate limits rigorosos. Nossa estratégia de defesa em camadas:

1. **Cache Next.js (`revalidate`)** — reduz chamadas repetidas à API externa.
2. **`try/catch` com fallback local** — se a CheapShark falhar, retornamos dados estáticos (`fallbackDeals`). O usuário nunca vê tela branca.
3. **Validação de parâmetros** — em `getDealsAction()`, os parâmetros `sortBy`, `pageSize`, `upperPrice`, `lowerPrice`, `storeID` e `title` são validados antes de serem enviados à API.
4. **Timeout no banco** — `connect_timeout: 5` no client `postgres` para evitar hangs em serverless.
5. **Logs de erro** — toda falha é logada com `console.error` para diagnóstico.

---

**Próximo Passo:** Entenda como o backend gerencia perfis de usuário, XP, badges e estado global no módulo [03. Gamificação e Estado Global](03-gamification-and-state.md).
