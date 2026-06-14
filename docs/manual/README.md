# 📖 GameDeals: O Manual Absoluto e Enciclopédia do Projeto

Este diretório contém a dissecagem técnica completa, lógica e arquitetural do projeto **GameDeals**. Ele foi projetado não apenas para documentar "o que" o código faz, mas sim **"por que"** ele foi escrito dessa exata maneira, servindo como o mapa definitivo para recreação ou manutenção do sistema.

> [!IMPORTANT]
> A leitura deste manual deve ser feita de forma sequencial para garantir que as decisões de infraestrutura sejam compreendidas antes da dissecagem dos componentes visuais.

## 🗂️ Índice Estrutural

1. **[01. Arquitetura e Decisões Fundamentais](01-architecture-and-decisions.md)**
   A base filosófica do projeto. Por que Next.js 16 com App Router? Por que Tailwind CSS v4? As escolhas de estado (Zustand + TanStack Query) e persistência (Drizzle ORM + PostgreSQL). Como organizamos o repositório.

2. **[02. Infraestrutura de API e Serviços](02-api-and-services.md)**
   A arquitetura de dados completa: Server Actions como camada primária de dados, TanStack Query para cache e refetch no cliente, cron endpoints para pipelines agendados, e a CheapShark API com fallback resiliente e suporte a grey markets.

3. **[03. Gamificação e Gerenciamento de Estado](03-gamification-and-state.md)**
   As três camadas de estado: Zustand (estado global do cliente com persistência local), TanStack Query (cache de dados do servidor) e Drizzle ORM (persistência relacional). O sistema de gamificação com XP, badges e playlists via Server Actions e PostgreSQL.

4. **[04. Roteamento e Páginas (App Router)](04-pages-routing.md)**
   O root layout e seus slots (modal, SyncManager), o loading state com Suspense, a paralelização de requisições na Home Page com `Promise.all`, e o padrão de Intercepting Routes para modais sobrepostos com fallback para rotas estáticas.

5. **[05. Core UI Components](05-core-components.md)**
   Dissecação em blocos lógicos dos componentes base: `GameCard` com micro-interações (wishlist, alertas, playlists), `HeroSection` com Tailwind CSS v4 e carrossel dinâmico, `Navbar` com busca reativa e sessão, e modais de autenticação.

6. **[06. Feature Components](06-feature-components.md)**
   Dissecação dos componentes autossuficientes: `HistoricalLows` com detecção de preço histórico, `ActivityFeed` reativo integrado à gamificação, `DynamicCharts` com lazy loading via `next/dynamic`, e `Freebies` com tratamento de vazio.

---
*Manual gerado e versionado diretamente junto ao código-fonte.*
