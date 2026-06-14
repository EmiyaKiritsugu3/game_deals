# 🏗️ 01. Arquitetura e Decisões Fundamentais

Este documento funde o Dicionário da Tech Stack com a Análise de Arquitetura. Ele serve para responder à pergunta mais importante: **Por que o projeto foi construído assim?**

> **Nota sobre versionamento:** Este manual reflete a stack atual (2026). Decisões arquiteturais registradas formalmente estão nos ADRs (`docs/adr/`), que são a fonte da verdade — quando este manual divergir de um ADR, o ADR prevalece.

## 1. O Core Framework: Next.js 16 (App Router, Turbopack)

- **A Escolha:** Next.js 16 com App Router, Turbopack como bundler padrão, React 19 como runtime. A stack roda estritamente sobre Server Components por padrão.
- **O Porquê:** O GameDeals é um agregador de preços fortemente focado em SEO e Core Web Vitals. O App Router permite que a busca de dados aconteça no servidor, sem enviar JavaScript pesado ao cliente. O Turbopack reduz o tempo de build e refresh em desenvolvimento (~3x mais rápido que webpack). React 19 traz Server Actions estáveis e o Compiler para otimização automática de memos e callbacks.
- **ISR como Estratégia de Cache:** A home page (`src/app/page.tsx`) usa `export const revalidate = 3600` — Incremental Static Regeneration com revalidação a cada 1 hora. Isso significa que a página é gerada estaticamente no build e revalidada em background a cada 3600 segundos. Diferente de `force-dynamic`, o ISR entrega HTML estático para o usuário final (performance máxima) enquanto mantém os dados atualizados. Se a CheapShark API falhar durante a revalidação, o cache anterior permanece servindo — a página nunca quebra.
- **Fallback de Dados:** `src/data/fallbackDeals.ts` contém um array de deals hardcoded. Se a API externa retornar vazio ou erro, os componentes recebem esse fallback. A UI nunca exibe um estado vazio ou quebrado.
- **Regra de Ouro:** `'use client'` é usado de forma cirúrgica. Apenas componentes interativos periféricos (Navbar com busca reativa, modais de wishlist, alertas de preço, indicadores de coração) são Client Components. Toda a estrutura pesada (Hero, listas de deals, gráficos base) nasce no servidor.

**Referências:** [ADR-001: Tech Stack](/docs/adr/ADR-001-tech-stack.md)

## 2. A Filosofia de Estilização: Tailwind CSS v4 com Design Tokens

- **A Escolha:** Tailwind CSS v4 em modo **CSS-first**, com `@theme` para design tokens customizados e `@utility` para padrões visuais do GameDeals (glassmorphism, glow effects). A configuração vive em `src/app/globals.css` via `@import "tailwindcss"` — sem arquivo `tailwind.config.js`.
- **O Porquê:**
    1. **Produtividade:** 80% do CSS vira utilities inline (`flex`, `grid`, `gap-4`, `text-lg`). Layout, espaçamento e tipografia deixam de exigir arquivos `.module.css` para cada componente.
    2. **Consistência:** Os design tokens do tema OLED/glassmorphism são centralizados no bloco `@theme`:
        ```css
        @theme {
          --color-oled-black: #0a0a0f;
          --color-glass-bg: rgba(15, 15, 25, 0.72);
          --blur-glass: 24px;
          --glow-primary: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15), transparent 60%);
          --color-accent-primary: #8b5cf6;
        }
        ```
    3. **Glassmorphism preserved:** O visual "glass" (backdrop-filter, blur, bordas translúcidas) não se perdeu — foi encapsulado em uma `@utility glass` que se aplica com `className="glass"`:
        ```css
        @utility glass {
          background: var(--color-glass-bg);
          backdrop-filter: blur(var(--blur-glass));
          border: 1px solid var(--color-glass-border);
          border-radius: var(--radius-glass);
        }
        ```
    4. **Performance:** Tailwind v4 é CSS puro em build-time — zero runtime, tree-shaking automático, 3.78x mais rápido que v3. Para um projeto com tema escuro pesado e animações, isso elimina o CSS não utilizado em produção.
- **Migração Gradual:** CSS Modules ainda coexistem em componentes legados (como `page.module.css` na home page). A migração é componente por componente, sem pressa. O importante é que *novos* componentes seguem Tailwind v4.
- **Animações:** Framer Motion para animações declarativas (entrada de modal, transições de página, staggered animations em listas). `@keyframes` complexos permanecem no `globals.css` abaixo do `@import`.

**Referências:** [ADR-011: Styling Architecture — Tailwind CSS v4](docs/adr/ADR-011-styling-tailwind-v4.md)

## 3. Estado, Fetching & Persistência

O GameDeals gerencia três camadas de estado, cada uma com sua ferramenta específica:

### Zustand — Estado Global do Cliente
- **O quê:** Wishlist, status de autenticação, alertas de preço, estado de UI (sidebar, toasts, modais).
- **O Porquê:** Leve (~1KB), TypeScript-first, middleware `persist` nativo para sincronizar localStorage com Supabase. Evita prop drilling sem o peso de Redux.
- **Padrão:** Stores em `src/store/` com `create<State>()(persist(...))`. Exemplo: `wishlistStore.ts` persiste itens no localStorage com chave `gamedeals-wishlist` e posteriormente sync com o banco via Server Action.

### TanStack Query v5 — Dados do Servidor (Cache e Refetch)
- **O quê:** Queries de deals, busca no Navbar, histórico de preços, detalhes de jogo.
- **O Porquê:** TanStack Query v5 substituiu o SWR por três razões:
    1. **Network Mode:** Suporte nativo a estados online/offline.
    2. **Persisted Query Client:** Cache sobrevive a reload da página.
    3. **Optimistic Updates:** API madura para atualizações otimistas (adicionar à wishlist instantaneamente).
    4. **Server Components:** Integração via `dehydrate`/`hydrate` para SSR.
- **Padrão:** Hooks em `src/hooks/` que envolvem chamadas às Server Actions com `useQuery`:
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
    O SWR ainda existe em lugar nenhum — foi removido completamente.

### Server Actions — Camada de Mutação e Fetching Nativo
- **O quê:** Operações que rodam no servidor com `'use server'`. Cobrem 60% dos casos de data fetching e 100% das mutações simples.
- **O Porquê:** Next.js 16 estabilizou Server Actions. Elas eliminam a necessidade de API routes para operações CRUD comuns: criar playlist, registrar alerta de preço, logar clique de afiliado, buscar deals da CheapShark com cache integrado.
- **Padrão:** Funções em `src/actions/` que usam `fetch` com `next: { revalidate }` para ISR programático, ou Drizzle ORM para operações no banco:
    ```typescript
    'use server';
    export async function getDealsAction(params) {
      const url = new URL('https://www.cheapshark.com/api/1.0/deals');
      // ... validação de params ...
      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) return fallbackDeals;
      return (await res.json()) as Deal[];
    }
    ```
- **Divisão de Responsabilidades:**
    - **Server Components (`page.tsx`):** ISR com `revalidate = 3600` para dados estáticos de SEO.
    - **Server Actions:** Mutação e fetching com cache granular por endpoint.
    - **TanStack Query:** Interatividade no cliente (busca reativa, refetch, infinite scroll, optimistic updates).
    - **Zustand:** Estado que não vem do servidor (sidebar aberta, preferências de tema, wishlist offline).

### Drizzle ORM — Persistência Relacional
- **O quê:** ORM type-safe sobre PostgreSQL (Supabase). Schema em `src/db/schema/`, cliente singleton em `src/db/index.ts`.
- **O Porquê:** Drizzle foi escolhido sobre Prisma por três motivos:
    1. **Performance:** Prepared statements nativos, 4.6k req/s em benchmarks, sem camada de runtime pesada.
    2. **Edge-ready:** Funciona em edge functions (sem Node.js binary requirement).
    3. **Type-safe SQL:** O schema gera tipos TypeScript que fluem para as Server Actions e componentes — sem `any` nem conversão manual.
- **Padrão:** Tabelas definidas com `pgTable` e `drizzle-orm/pg-core`:
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
    O cliente é inicializado uma vez em `src/db/index.ts` com `postgres` pool + `drizzle()`. Todas as operações de banco (cron de ingestão, gamificação, playlists, wishlist) usam esse mesmo `db` exportado, garantindo consistência de conexão.

### Diagrama de Fluxo de Dados (Atualizado)

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                      │
│                                                              │
│  Servidor                                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  page.tsx (ISR revalidate=3600)                       │   │
│  │    │ fetch() com next: { revalidate }                  │   │
│  │    ▼                                                    │   │
│  │  CheapShark API ── falha? ──► fallbackDeals.ts        │   │
│  │                                                         │   │
│  │  Server Actions (src/actions/*.ts)                      │   │
│  │    ├── Drizzle ORM ──► PostgreSQL (Supabase)           │   │
│  │    ├── fetch() ──► CheapShark API                      │   │
│  │    └── fetch() ──► Typesense Cloud                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
│  Cliente                                                      │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  TanStack Query v5 (src/hooks/)                       │   │
│  │    ├── Cache, dedup, refetch, optimistic              │   │
│  │    └── Wraps Server Actions para uso no cliente       │   │
│  │                                                         │   │
│  │  Zustand (src/store/)                                   │   │
│  │    ├── wishlistStore, authStore, alertStore, uiStore   │   │
│  │    └── Persistência localStorage ↔ Supabase           │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Referências:** [ADR-003: State Management](docs/adr/ADR-003-state-management.md), [ADR-001: Tech Stack](docs/adr/ADR-001-tech-stack.md)

## 4. O Sistema "T3-ish" (Arquitetura Modular)
- **Estruturação Funcional:** Componentes como `HistoricalLows` e `EndingSoon` foram modularizados para conterem seu próprio fetching interno e seu próprio estilo. Cada seção é autossuficiente.
- **O Porquê:** Na arquitetura anterior, injetávamos `deals` de todos os tipos via props no componente principal, transformando a raiz na controladora total de dados. A modularização transferiu o "cérebro" para cada Seção. Se a seção de Novidades falhar, a seção de Historical Lows lida em isolamento com a própria falha.

---
**Próximo Passo:** Entenda como as Server Actions e a TanStack Query orquestram o fluxo de dados no módulo [02. Infraestrutura de API e Serviços (Services)](02-api-and-services.md).
