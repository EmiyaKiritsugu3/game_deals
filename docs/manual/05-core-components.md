# 🧱 05. Core UI Components

Os *Core Components* são a base da interface do usuário. Eles são usados globalmente e formam a espinha dorsal visual da aplicação.

## 1. GameCard (`src/components/GameCard.tsx`)
A menor unidade vitrine estrutural.
- **Props:** Recebe um único objeto `deal` (tipo `Deal` da CheapShark).
- **Lógica e Constantes:** 
  Calcula na montagem `isEpicDeal` (>= 85% desconto) e `isHistoricalLow` (>= 90% desconto). Isso automatiza a adição mecânica de labels pela interface.
- **Micro-interações:** Contém internamente os gatilhos sub-componentes:
  - `<AddToListButton />`: Integra com a gamificação (Playlists).
  - `<HeartButton />`: Comunica com o `wishlistStore` (Zustand).
  - `<PriceAlertBadge />`: Comunica com o `alertStore` (Zustand).
- **Responsabilidade do CSS Module:** Utiliza `:hover` em conjunto com `.imageWrapper` para expor sutilmente o overlay dos botões apenas quando a atenção do mouse está no componente.

## 2. HeroSection (`src/components/HeroSection.tsx`)
O painel de destaque no topo da aplicação.
- **Vanilla CSS Exclusivo:** Restaurado de um experimento desastroso de Tailwind, o HeroSection domina a tela puramente pelo seu `HeroSection.module.css`.
- **Lógica de Estado:** Embora receba múltiplas *deals* do servidor, é forçado a um **Client Component** para rodar um `setInterval` atrelado ao `currentIndex`.
- **O Fundo Estético:** Um grid denso (usando `Array(15).fill`) clona as capas de jogos para atuar como uma matriz infinita rotacionada em um ângulo Z (`rotateZ`). A imagem do showcase usa blend modes (`mix-blend-luminosity`) e gradientes puramente via CSS dinâmico.

## 3. Navbar (`src/components/Navbar.tsx`)
O cérebro constante da navegação e do live-search.
- **Lógica de Busca (SWR):** A barra de pesquisa utiliza um Hook do SWR acoplado a um `useDebounce`. O usuário digita dezenas de letras, o Debounce amortece a carga, e o SWR faz o request ao servidor sem spammar a API.
- **Lógica de Busto (A sessão):** Ouve o `authStore` do Supabase para transmutar dinamicamente o botão "Login" para o Avatar do usuário, mostrando badges ativas conquistadas via Gamificação.

## 4. Auth & Side Modals (`src/components/*Modal.tsx`)
- **Modularização de Renderização:** Por que o `SidebarModal` precisa envolver todos os conteúdos periféricos? Ele provê o fundo `backdrop-blur` global e previne que o CSS de scroll vaze (adicionando `.no-scroll` ao `body`). Se o usuário apertar `ESC` ou clicar no fundo preto, o React Router emite um `router.back()`.

---
**Próximo Passo:** Explore como a lógica densa se concentra em seções independentes no módulo [06. Feature Components](06-feature-components.md).
