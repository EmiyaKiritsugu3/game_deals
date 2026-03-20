# 📘 GameDeals: Tech Stack Dictionary & Architecture Guide

Este documento serve como a **Fonte da Verdade** técnica para o projeto GameDeals. Se você é o Jules (ou qualquer outro colaborador), siga estas diretrizes para manter a consistência e a performance do sistema.

---

## 🏗️ Core Framework & Language
- **Next.js 14 (App Router):** Utilizamos a versão mais recente do Next.js. Quase tudo no diretório `src/app` é **Server Component** por padrão. Use **Client Components** (`'use client'`) apenas quando necessário (hooks, interações).
- **TypeScript:** Tipagem estrita é obrigatória. Interfaces para APIs estão centralizadas em `src/services/api.ts`.

---

## 🎨 Styling & UI Architecture
- **CSS Modules (Vanilla CSS):** **NÃO USE TAILWIND.** Cada componente tem seu próprio arquivo `.module.css`. Isso nos dá controle total sobre o design "Glassmorphism" e animações.
- **Design Tokens:** Use as variáveis definidas em `src/app/globals.css` (ex: `var(--accent-light)`, `var(--bg-dark)`).
- **Responsive Design:** O layout é mobile-first. Use `flexbox` e `grid` com variáveis CSS.

---

## 📦 State Management & Data Fetching
- **Zustand:** Gerencia o estado global (Wishlist, Auth, Alertas de Preço). Os stores estão em `src/store/`.
- **SWR:** Usado para buscas em tempo real e revalidação de dados no lado do cliente (ex: Search bar no Navbar).

---

## 🛠️ Key Libraries
- **Lucide React:** Nossa biblioteca de ícones padrão. Evite SVGs crus nos componentes.
- **Framer Motion:** Usado para todas as transições de página, modais e efeitos de entrada (staggered animations).
- **Recharts:** Renderiza os gráficos de histórico de preços em `SidebarModal.tsx`.

---

## 🔐 Backend & Auth
- **Supabase:** Nosso backend-as-a-service. 
    - **Auth:** Gerencia login social e e-mail.
    - **PostgreSQL:** Armazena perfis, wishlists e alertas de preços.
- **Environment Variables:** Localizadas em `.env.local`. Nunca as comite no Git.

---

## 🚀 Deployment & Resilience (Vercel)
- **SSR Fallback:** A Home Page (`src/app/page.tsx`) usa `export const dynamic = 'force-dynamic'`. Isso garante que a página seja gerada no momento da requisição, evitando erros de build quando a API externa está instável.
- **API Resilience:** Todas as chamadas de API em `api.ts` possuem blocos `try/catch` que retornam dados de **fallback** (`src/data/fallbackDeals.ts`) em vez de quebrar a aplicação.

---

## 🗺️ Advanced Routing Patterns
- **Intercepting Routes:** Usamos `src/app/@modal/(.)game/[id]` para abrir o detalhe do jogo em um **Sidebar Modal** lateral sem perder o contexto da página anterior. Se o usuário der F5, o Next.js renderiza a página standalone `src/app/game/[id]`.

---

## 💡 Mensagem para o Jules
> *"Ao implementar novas funcionalidades sociais, sempre crie um arquivo `.module.css` correspondente. Se precisar de dados de jogadores ou reviews, prefira criar mocks em `src/data` antes de subir para o Supabase real. Mantenha o estilo 'Premium Dark' com backgrounds semitransparentes e borrões de vidro (backdrop-filter: blur)."*
