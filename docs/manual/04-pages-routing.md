# 🛤️ 04. Roteamento e Páginas (App Router)

O GameDeals usa o App Router do Next.js 16 com estrutura de pastas em `src/app/`. Abaixo, a dissecção de cada rota, seus padrões de dados e decisões arquiteturais.

```
src/app/
├── layout.tsx              # Root layout — providers, fonts, JSON-LD
├── page.tsx                # Home — ISR revalidate=3600
├── loading.tsx             # Loading state global (Suspense)
├── not-found.tsx           # Página 404 customizada
├── globals.css             # Estilos globais (Tailwind v4)
├── sitemap.ts              # Sitemap dinâmico
├── robots.ts               # Configuração robots.txt
│
├── @modal/                 # Parallel Route — interceptação de rotas
│   └── (.)game/[id]/
│       └── page.tsx        # Modal de detalhe do jogo (sidebar overlay)
│
├── game/
│   └── [id]/
│       └── page.tsx        # Página de detalhe do jogo (full page)
│
├── search/
│   └── page.tsx            # Busca com filtros (CheapShark)
│
├── wishlist/
│   ├── page.tsx            # Dashboard protegido (wishlist + alertas)
│   └── shared/
│       └── page.tsx        # Wishlist compartilhada (pública, base64)
│
├── bundles/
│   └── page.tsx            # Lista de bundles (dados estáticos)
│
├── collections/
│   ├── page.tsx            # Índice de coleções curadas
│   └── [slug]/
│       └── page.tsx        # Detalhe da coleção (generateStaticParams)
│
├── out/
│   └── [storeId]/[gameSlug]/
│       └── route.ts        # Redirect cloak de afiliado
│
├── auth/
│   └── callback/
│       └── route.ts        # Callback OAuth Supabase
│
└── api/
    └── cron/
        ├── ingest-prices/     # Cron: ingestão CheapShark (4h)
        ├── reindex-typesense/ # Cron: reindex Typesense (diário)
        └── check-alerts/      # Cron: verificação de alertas
```

---

## 1. Root Layout (`src/app/layout.tsx`)

O layout raiz é um **Server Component** que orquestra toda a aplicação. Seus props incluem `{ children, modal }` — o segundo é um **Parallel Route Slot** que o Next.js preenche automaticamente com o conteúdo de `@modal/`.

Responsabilidades:

- **Fontes:** Inter via `next/font/google` na variável CSS `--font-inter`.
- **SEO Global:** Metadados Open Graph, Twitter Cards, JSON-LD (WebSite + SearchAction) injetado via `<script type="application/ld+json">`.
- **Providers:** `NuqsAdapter` (query string state), `ReactQueryProvider` (TanStack Query).
- **Componentes Fixos:** `Navbar` (navegação global), `SyncManager` (sincroniza auth Zustand + Supabase), `CookieBanner`.
- **Analytics:** `@vercel/analytics/react` + `@vercel/speed-insights/next` no final do `<body>`.
- **Modal Slot:** `{modal}` renderizado abaixo de `{children}`, permitindo que rotas interceptadas sobreponham o conteúdo.

```tsx
// layout.tsx — trecho do return
<NuqsAdapter>
  <ReactQueryProvider>
    <Navbar serverUser={null} />
    <SyncManager />
    {children}
    {modal}
    <Analytics />
    <SpeedInsights />
    <CookieBanner />
  </ReactQueryProvider>
</NuqsAdapter>
```

> [!IMPORTANT]
> O slot `modal` é obrigatório no layout. Sem ele, a interceptação de rota `@modal/(.)game/[id]` não funciona.

---

## 2. Loading Global (`src/app/loading.tsx`)

Renderizado automaticamente pelo React Suspense durante transições de rota. Exibe um spinner com a mensagem "Scanning for discounts...". Previne a sensação de travamento enquanto Server Components carregam dados remotos.

---

## 3. Home Page (`src/app/page.tsx`)

**Server Component** com **ISR** configurado via `export const revalidate = 3600` (revalida a cada 1 hora).

### Estratégia de Dados

Usa `Promise.all` para buscar 5 categorias em paralelo, eliminando waterfall:

```tsx
const [popular, bestDeals, recentDeals, flashDeals, freebies] = await Promise.all([
  getDeals({ pageSize: '5' }),            // Deal Rating (default)
  getDeals({ sortBy: 'Savings', pageSize: '10' }), // Maior %
  getDeals({ sortBy: 'Recent', pageSize: '10' }),  // Mais recentes
  getDeals({ sortBy: 'Price', pageSize: '8', onSale: '1' }), // Flash
  getDeals({ upperPrice: '0', pageSize: '6' }), // 100% OFF Freebies
]);
```

### Seções

| Seção | Fonte | Renderização |
|-------|-------|-------------|
| Hero Carrossel | `popular.slice(0, 5)` | Server — passa `deals` como prop |
| Freebies | `freebies` | Server — componente `Freebies` |
| Flash Sales | `flashDeals` | Server — `FlashSales` |
| Grid Populares | `popular.slice(5)` | Server — `GameCard` em grid |
| New Deals | `recentDeals` | Server — `DealRow` em lista |
| Best Deals | `bestDeals` | Server — `DealRow` em lista |
| Historical Lows | Hook próprio (`getDeals` interno) | Modular — sem props |
| Ending Soon | Hook próprio (`getDeals` interno) | Modular — sem props |

Os dois últimos (`<HistoricalLows />` e `<EndingSoon />`) são módulos autossuficientes que disparam suas próprias requisições `getDeals()`. Isso reduz o tamanho do `page.tsx` e permite que cada um tenha sua própria lógica de loading.

---

## 4. Detalhe do Jogo (`/game/[id]`)

### Full Page (`src/app/game/[id]/page.tsx`)

**Server Component** com metadados dinâmicos via `generateMetadata` — busca o jogo pela CheapShark API e gera título OG com melhor preço.

Fluxo:
1. Extrai `id` de `params` (agora `Promise<{ id: string }>` no Next.js 16).
2. Busca `getGame(id)` + `getStores()` em paralelo via `Promise.all`.
3. Renderiza hero image, estatísticas (best price, historical low, cost-per-hour), grid de ofertas (Official Stores + Keyshops), gráfico de histórico de preços, e store comparison chart.
4. Injeta JSON-LD do tipo Product com as ofertas.

Tratamento de erro: se `game.info` for null, exibe "Game not found" com link de retorno.

### Modal Interceptado (`src/app/@modal/(.)game/[id]/page.tsx`)

**Parallel + Intercepting Route.** O Next.js intercepta navegações internas para `/game/[id]` e renderiza o conteúdo dentro de `<SidebarModal>` — um overlay lateral que não substitui a página atual.

- Padrão: `(.)game/[id]` — o `(.)` indica interceptação de segmento do mesmo nível.
- Hard refresh (F5) rompe a interceptação e cai na rota primária `/game/[id]` (comportamento SEO-friendly).
- Usa `Suspense` com fallback "Loading game..." enquanto `GameModalContent` busca dados assíncronos.
- O conteúdo do modal é quase idêntico à página cheia, mas sem `generateMetadata` (modais não têm metadados próprios).

---

## 5. Busca (`/search?q=&upperPrice=&storeID=`)

**Server Component** em `src/app/search/page.tsx`. Metadados estáticos: `title: 'Search Results | Game Deals'`.

Fluxo:
1. Lê `searchParams` (agora `Promise<{ [key: string]: string | string[] | undefined }>` no Next.js 16).
2. Monta parâmetros da API CheapShark dinamicamente (`title`, `upperPrice`, `storeID`).
3. Busca stores ativas para alimentar o `<FilterSidebar />`.
4. Renderiza grid de resultados com `GameCard`.

Se deals estiver vazio, exibe "No deals found" com sugestão de ajustar filtros.

> Nota: atualmente a busca usa CheapShark diretamente. O Typesense está configurado para fallback futuro via `src/actions/search.ts`.

---

## 6. Wishlist (`/wishlist`)

**Client Component** (`'use client'`) em `src/app/wishlist/page.tsx`. Rota protegida pelo middleware — usuário não autenticado é redirecionado para `/` com `?auth=required`.

### Funcionalidades

- **Dashboard** com duas abas: Wishlist (coração) e Alertas (sino).
- **Ordenação:** por desconto, preço ou nome.
- **Compartilhamento:** codifica IDs em base64 e gera link `/wishlist/shared?ids=...`.
- **Card de Jogo:** thumb, preço, % desconto, badge da loja, link "Ver Detalhes".
- **Ações Inline:** `HeartButton` (remover) e `PriceAlertTrigger` (configurar alerta).
- **Painel de Estatísticas:** valor total da carteira e maior desconto.
- **Estado Vazio:** ilustração `HeartCrack` + call to action "Descobrir Ofertas Épicas".

Dados: usa `useWishlistGames(wishlist)` hook (TanStack Query) que recebe array de game IDs e retorna dados enriquecidos da CheapShark.

### Wishlist Compartilhada (`/wishlist/shared`)

**Client Component** que lê `ids` de `searchParams`, decodifica base64, valida com regex (`/^[a-zA-Z0-9]+$/`), e busca dados via `useWishlistGames`.

- Pública — qualquer um com o link pode ver.
- Sem autenticação necessária.
- Botão "Comprar como Presente" aponta para `/game/[id]`.

---

## 7. Bundles (`/bundles`)

**Server Component** com dados estáticos de `@/data/bundles`. Metadados: `title: 'Game Bundles | GameDeals'`.

Renderiza grid de bundle cards com:
- Store icon e nome, tier (se houver).
- Nome do bundle e thumbs dos jogos inclusos.
- Preço, número de jogos, valor total, % de economia.
- CTA externo com contagem regressiva de dias restantes.

Os bundles são definidos em arquivo TypeScript (`src/data/bundles.ts`) — atualização manual.

---

## 8. Coleções (`/collections`)

### Índice (`src/app/collections/page.tsx`)

**Server Component** estático. Lista todas as coleções definidas em `@/data/collections` com emoji, título, descrição e contagem de jogos. Cada card linka para `/collections/[slug]`.

### Detalhe (`src/app/collections/[slug]/page.tsx`)

**Server Component** dinâmico com `generateStaticParams` (gera páginas para todos os slugs de `COLLECTIONS`).

Fluxo:
1. Matcha `slug` contra `COLLECTIONS`. Se não encontrar, chama `notFound()`.
2. Busca todos os jogos da coleção em paralelo via `Promise.all(collection.gameIDs.map(id => getGame(id)))`.
3. Ordena deals pelo menor preço e exibe grid com thumb, título, preço e link "View Deal →".

---

## 9. Redirect de Afiliado (`/out/[storeId]/[gameSlug]`)

**Route Handler** (API Route via App Router) em `src/app/out/[storeId]/[gameSlug]/route.ts`.

Funcionamento:
1. Extrai `storeId` e `gameSlug` de `params`.
2. Valida `storeId` contra allowlist de 17 lojas (`affiliateConfig`) via regex `/^\d{1,3}$/`.
3. Valida `gameSlug` via regex `/^[a-zA-Z0-9_-]{1,100}$/`.
4. Busca URL do deal no banco (`deals` table via Drizzle raw SQL).
5. Aplica parâmetros de afiliado da config (ex: `?partner=gamedealsBR`, `?aff_id=gamedeals_fnt`).
6. Valida hostname contra `ALLOWED_DOMAINS` (previne redirecionamento arbitrário).
7. Loga clique na tabela `affiliate_clicks` (fire-and-forget, sem bloquear redirect).
8. Redireciona com `302`.

Se qualquer validação falhar, redireciona para `/` (safe fallback).

---

## 10. Auth Callback (`/auth/callback`)

**Route Handler** que completa o fluxo OAuth do Supabase.

Fluxo:
1. Rate limiting por IP (10 requisições por minuto via `@/lib/rate-limit`).
2. Extrai `code` e `next` da query string.
3. Valida que `next` é um path local (previne open redirect).
4. Troca `code` por sessão via `supabase.auth.exchangeCodeForSession(code)`.
5. Redireciona para `next` (ou `/` se não especificado).
6. Em caso de erro, redireciona para `/auth/auth-code-error`.

---

## 11. Endpoints Cron (`/api/cron/*`)

Protegidos por `CRON_SECRET` — verificam header `Authorization: Bearer ${CRON_SECRET}`. Retornam `401` se ausente ou inválido.

| Rota | Frequência | Ação |
|------|-----------|------|
| `ingest-prices` | A cada 4h | Busca deals da CheapShark, insere em `deals` + `price_history` via `ingestPricesAction()` |
| `reindex-typesense` | Diário | Reindexa todos os jogos do banco no Typesense via `syncGamesToTypesenseAction()` |
| `check-alerts` | Periódico | Consulta `price_alerts`, busca preços atuais, atualiza `currentPrice`, loga alertas disparados |

---

## 12. Middleware (`src/middleware.ts`)

Usa `@supabase/ssr` para refresh de sessão em toda requisição.

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Proteção de Rotas

O middleware verifica `supabase.auth.getUser()` em cada request:

- **Rotas protegidas** (`/wishlist`, `/alerts`, `/playlists`, `/profile`): redireciona para `/` com `?auth=required` se usuário não estiver autenticado.
- **Rotas de auth** (`/auth/*`): redireciona para `/profile` se usuário já estiver logado.
- **Demais rotas:** passa sem alteração.

### Cookies

Usa `getAll()`/`setAll()` do `@supabase/ssr` para sincronizar cookies entre request e response, garantindo que o token de sessão seja atualizado a cada navegação.

---

## 13. Sitemap & Robots

### Sitemap (`src/app/sitemap.ts`)

Gera sitemap dinâmico com:
- Páginas estáticas: `/` (priority 1.0, daily), `/search` (0.8, weekly), `/bundles` (0.7, weekly), `/collections` (0.7, monthly).
- Coleções dinâmicas: `top-deals`, `under-10`, `free-games`, `new-releases` (0.8, daily).

### Robots (`src/app/robots.ts`)

Permite rastreamento de todas as rotas exceto:
- `/api/` — endpoints de API
- `/auth/` — fluxo de autenticação
- `/out/` — redirects de afiliado

---

## Resumo de Padrões

| Padrão | Onde | Por quê |
|--------|------|---------|
| `Promise.all` paralelo | Home, Game Detail, Collections | Elimina waterfall de rede |
| Server Component por padrão | Todas as páginas | Menos JS no cliente, SSR nativo |
| `'use client'` só quando necessário | Wishlist (interatividade) | Estado local, animações, hooks |
| ISR (`revalidate`) | Home Page (3600s) | Conteúdo semi-estático com atualização periódica |
| Intercepting Route `(.)` | `@modal/(.)game/[id]` | UX de modal sem perder URL para SEO |
| Parallel Route `@modal` | Root layout | Slot dedicado para overlays |
| Route Handler | `/out/*`, `/auth/callback`, `/api/cron/*` | Lógica server-side sem React |
| Middleware auth | Toda requisição | Refresh de sessão + proteção de rotas |
| `generateMetadata` | Game detail, Collections | SEO dinâmico por página |
| `generateStaticParams` | Collections `[slug]` | Pré-renderização de páginas conhecidas |

---

**Próximo Passo:** Dissecção dos componentes visuais no módulo [05. Core UI Components](05-core-components.md).
