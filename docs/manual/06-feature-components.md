# 06. Feature Components

Componentes maiores que carregam inteligência de negócio independente. Eles podem viver, morrer ou quebrar sozinhos sem derrubar a tela (Graças à arquitetura Next.js App Router).

## 1. Historical Lows (`src/components/HistoricalLows.tsx`)

- **Componente Servidor (Server Component):** Executa de forma assíncrona pura, sem `'use client'`. Não usa TanStack Query — busca dados diretamente da CheapShark API.
- **Lógica de Negócio:**
  A CheapShark API devolve vitrines de jogos em promoção, mas não avisa proativamente quais bateram o preço histórico. Esse componente:
  1. Chama `Promise.all` para buscar três listagens: Deal Rating, Savings e Recent.
  2. Deduplica os resultados com `Array.from(new Map(...).values())`.
  3. Varre a lista com `Promise.all` chamando `getGame(id)` para cada candidato.
  4. Filtra apenas deals onde `salePrice <= cheapestPriceEver * 1.01` (tolerância de 1%).
  5. Retorna `null` se não houver lows — colapsa a UI graças ao layout Flexbox.
- **Estilização:** Tailwind v4 com tokens `@theme` + estilo local encapsulado.

## 2. ActivityFeed (`src/services/social.ts`)

A engrenagem do engajamento (Gamificação).

- **Abordagem:** Não existe como componente React isolado. A lógica social vive em `src/services/social.ts`, que consome o cliente Supabase diretamente para operações de playlist, badges e estatísticas.
- **Integração com Gamificação:**
  - `createPlaylist()` / `getUserPlaylists()` — CRUD de playlists via Supabase.
  - `getUserStats()` / `getUserBadges()` — estatísticas e conquistas do usuário.
  - `checkAchievements()` — lógica de concessão automática de badges.
- **Server Actions:** Operações críticas de gamificação (XP, badges) são wrappers em `src/actions/gamification.ts`, chamadas de componentes client ou rotas.
- **Estilização:** Os componentes que consomem esse serviço (`AuthModal`, `AddToListModal`) usam Tailwind v4 com tokens `@theme`.

## 3. Dynamic Charts (`src/components/DynamicCharts.tsx` + `src/components/Charts.tsx`)

- **`'use client'`:** Necessário para interatividade dos gráficos Recharts.
- **Lazy Loading:** Recharts é importado dinamicamente via `next/dynamic` com `{ ssr: false }` para não inflar o bundle inicial:
  ```typescript
  const PriceHistoryChartLazy = dynamic(
    () => import('./Charts').then((mod) => mod.PriceHistoryChart),
    { ssr: false, loading: () => <div>Loading History...</div> }
  );
  ```
- **TanStack Query Hook:** `DynamicPriceHistory` chama `useDailyPriceHistory(gameId)` de `@/hooks/usePriceHistory`, que por sua vez chama a Server Action `getDailyPriceHistoryAction()` no banco (Drizzle + PostgreSQL). Se o jogo não tem gameId, o hook é desabilitado via `enabled: !!gameId`.
- **Render Logic:** O `PriceHistoryChart` renderiza `LineChart` do Recharts. Usa dados reais do banco quando disponíveis (`realData.length > 2`), senão gera dados simulados via `generatePriceHistory()`.
- **`DynamicStoreCompare`:** Renderiza `BarChart` comparando preços entre lojas.
- **Estilização:** Tailwind v4 com variáveis CSS `hsl(var(--...))` para cores do tema escuro.

## 4. Freebies (`src/components/Freebies.tsx`)

- **Componente Cliente/Servidor Híbrido:** Recebe `deals: Deal[]` como prop, populada pelo Server Component da Home Page.
- **Query:** A Home Page chama `getDeals({ upperPrice: "0" })` diretamente na CheapShark API (sem TanStack Query — é chamada única server-side).
- **Tratamento de Vazio:** Se `deals` for vazio, retorna `null` — a linha colapsa automaticamente graças ao Flexbox do layout.
- **Render:** Slice de 6 deals, cada um com thumbnail (via `next/image`), badge "GRÁTIS" e voucher "-100%".
- **Estilização:** Tailwind v4 + design tokens do `tokens.css`.

## 5. Search Results (`src/app/search/page.tsx`)

- **Componente Servidor:** Página de busca server-side com suporte a query params (`q`, `upperPrice`, `storeID`).
- **Data Fetching:** Chama `getDeals()` com os parâmetros do usuário diretamente da CheapShark API. Para busca textual, envia `title` nos params.
- **Stores Sidebar:** Busca lojas ativas via `getStores()` + fetch direto da CheapShark.
- **Render:** Grid de `GameCard` components. Estado vazio com mensagem amigável.
- **Estilização:** Tailwind v4 com classes utilitárias globais + design tokens do `tokens.css`.

## 6. Bundles (`src/app/bundles/page.tsx`)

- **Componente Servidor:** Página de bundles agregados de lojas (Humble Bundle, Fanatical).
- **Data Source:** Dados estáticos em `src/data/bundles.ts` — simulação até integração com APIs reais.
- **Render:** Grid de cards de bundle, cada um com:
  - Informações da loja (ícone + nome)
  - Grid de thumbnails dos jogos inclusos
  - Preço, valor total e badge de economia
  - Contagem regressiva de dias restantes
- **Estilização:** Tailwind v4 com tokens de cor e tipografia do `tokens.css`.

## 7. Collections (`src/app/collections/[slug]/page.tsx`)

- **Componente Servidor:** Página de detalhe de coleção com ISR via `generateStaticParams()`.
- **Data Source:** Metadados estáticos em `src/data/collections.ts` com lista de gameIDs.
- **Data Fetching:** Busca todos os jogos em paralelo via `Promise.all(collection.gameIDs.map(id => getGame(id)))`. Ordena deals de cada jogo pelo menor preço.
- **Render:** Grid de linhas com thumbnail, título, preço (ou FREE) e CTA "View Deal".
- **Collections Index (`src/app/collections/page.tsx`):** Card grid com metadados estáticos, links para detalhe.

---

## Hooks TanStack Query

Hooks client-side que encapsulam Server Actions com cache e stale-while-revalidate:

### `useDailyPriceHistory(gameId, days)` — `src/hooks/usePriceHistory.ts`

```typescript
export function useDailyPriceHistory(gameId: string | null, days = 90) {
  return useQuery({
    queryKey: ['priceHistory', 'daily', gameId, days],
    queryFn: () => getDailyPriceHistoryAction(gameId ?? '', days),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,  // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  });
}
```

### `useWeeklyPriceHistory(gameId, weeks)` — `src/hooks/usePriceHistory.ts`

```typescript
export function useWeeklyPriceHistory(gameId: string | null, weeks = 26) {
  return useQuery({
    queryKey: ['priceHistory', 'weekly', gameId, weeks],
    queryFn: () => getWeeklyPriceHistoryAction(gameId ?? '', weeks),
    enabled: !!gameId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

### `useWishlistGames(gameIds)` — `src/hooks/useWishlistGames.ts`

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
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## Estrutura de Estilização

O projeto usa **Tailwind CSS v4** importado via `@import "tailwindcss"` no `globals.css`. Tokens customizados definidos em `tokens.css` com `@theme`:

```css
@theme {
  --color-bg-dark: hsl(228 15% 13%);
  --color-primary: hsl(150 100% 42%);
  --color-accent-hl: hsl(150 88% 27%);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

O sistema global de design tokens é gerenciado pelo Tailwind v4 via `@theme`, com componentes consumindo as variáveis CSS geradas automaticamente.

---

## Server Actions

As Server Actions em `src/actions/deals.ts` e `src/actions/search.ts` servem como ponte entre componentes client e dados externos:

| Action | Função | Usada por |
|--------|--------|-----------|
| `getDealsAction()` | Busca deals da CheapShark com validação e fallback | Hooks TanStack Query / Server Components |
| `getGameAction(id)` | Detalhes de um jogo | Server Components |
| `getStoresAction()` | Mapa lojaID → nome | Hooks / Componentes |
| `getDailyPriceHistoryAction(gameId, days)` | Histórico diário do banco (Drizzle) | `useDailyPriceHistory` |
| `getWeeklyPriceHistoryAction(gameId, weeks)` | Histórico semanal do banco | `useWeeklyPriceHistory` |
| `searchGamesAction(query, limit)` | Busca textual via Typesense (fallback CheapShark) | Componentes de busca |
| `ingestPricesAction()` | Cron job: ingestão de deals no banco | Rota `/api/cron/ingest-prices` |

---

🎉 **Próximo:** Você leu o Manual dos Feature Components. Esses componentes formam a camada de inteligência do GameDeals — combinando Server Components para dados frescos, TanStack Query para cache client-side, Server Actions como ponte segura, e Tailwind v4 para estilização consistente.
