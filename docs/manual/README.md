# 📖 GameDeals: O Manual Absoluto e Enciclopédia do Projeto

Este diretório contém a dissecagem técnica completa, lógica e arquitetural do projeto **GameDeals**. Ele foi projetado não apenas para documentar "o que" o código faz, mas sim **"por que"** ele foi escrito dessa exata maneira, servindo como o mapa definitivo para recreação ou manutenção do sistema.

> [!IMPORTANT]
> A leitura deste manual deve ser feita de forma sequencial para garantir que as decisões de infraestrutura sejam compreendidas antes da dissecagem dos componentes visuais.

## 🗂️ Índice Estrutural

1. **[01. Arquitetura e Decisões Fundamentais](01-architecture-and-decisions.md)**
   A base filosófica do projeto. Por que Next.js 14? Por que Vanilla CSS e não Tailwind? Como dividimos o repositório.

2. **[02. Infraestrutura de API e Serviços (Services)](02-api-and-services.md)**
   Como lidamos com a limitação de Rate Limit da CheapShark, estratégias agressivas de fallback no Vercel e chamadas de rede resilientes.

3. **[03. Gamificação e Gerenciamento de Estado](03-gamification-and-state.md)**
   Como o sistema social foi acoplado por cima do Supabase. A lógica de XP, Badges (Insignias) e Playlists, além do papel do Zustand no estado global.

4. **[04. Roteamento e Páginas (App Router)](04-pages-routing.md)**
   Por que juntamos as listas no `Promise.all` da Home Page? Como o Intercepting Route abre os modais de jogos e permite que a URL `/game/[id]` funcione perfeitamente.

5. **[05. Core UI Components](05-core-components.md)**
   Dissecação em blocos lógicos (Props -> Hook -> Render Logic -> CSS Modules) dos componentes base, como `GameCard`, `HeroSection`, `Navbar` e Modais.

6. **[06. Feature Components](06-feature-components.md)**
   Dissecação dos componentes inteligentes e pesados, como `HistoricalLows`, `ActivityFeed`, `DynamicCharts` e `Freebies`.

---
*Manual gerado e versionado diretamente junto ao código-fonte.*
