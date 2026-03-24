# 🏗️ 01. Arquitetura e Decisões Fundamentais

Este documento funde o Dicionário da Tech Stack com a Análise de Arquitetura. Ele serve para responder à pergunta mais importante: **Por que o projeto foi construído assim?**

## 1. O Core Framework: Next.js 14 (App Router)
- **A Escolha:** O ecossistema roda estritamente sobre Server Components por padrão. 
- **O Porquê:** O GameDeals é fortemente focado em SEO e agregação de preços estáticos que mudam algumas vezes ao dia. O App Router permite que busquemos dados diretamente do servidor sem enviar JavaScript pesado para o cliente. 
- **Regra de Ouro:** Utilizamos `'use client'` de forma cirúrgica. Apenas componentes interativos periféricos (como botões de coração, modais de wishlist e alertas de preço) são Client Components. Toda a estrutura pesada (Hero, Listas, Gráficos base) nasce no servidor.

## 2. A Filosofia de Estilização: Vanilla CSS Modules
- **A Escolha:** Foi **banido** o uso de frameworks utilitários como Tailwind CSS. O projeto inteiro usa `[NomeDoComponente].module.css`.
- **O Porquê:** 
    1. Manter a estilização altamente encapsulada e imutável. Um estilo de card nunca poluirá a barra lateral.
    2. Liberdade absoluta para manipular pseudoelementos complexos e *Glassmorphism* avançado (transições borradas `backdrop-filter`, brilhos absolutos `::after`, `::before`) que no Tailwind exigem strings monstruosas.
    3. Foco em uma base de código "clássica", que prioriza o controle de herança via variáveis definidas globalmente (`globals.css`).

## 3. Estado, Fetching & Resiliência
- **Zustand para Global State:** 
    - **O Porquê:** Evita o *prop drilling* doloroso para dados globais (Status de Login, Carrinho/Wishlist, Modais do usuário). É atômico e leve em contraste com Redux.
- **SWR para Fetching Client-side:**
    - **O Porquê:** Componentes como a Barra de Busca no Navbar requerem "pesquisa ao vivo". O SWR lida nativamente com de-duplicação, stale-while-revalidate, e caching de requisições rápidas.
- **SSR Fallbacks (Forced Dynamic):**
    - **A Decisão:** A `page.tsx` principal usa `export const dynamic = 'force-dynamic'`.
    - **O Porquê:** Se a API de jogos (`CheapShark`) falhasse durante o processo de Build na Vercel (geração do SSG estático), o Build caía por terra. Ao forçar a renderização dinâmica acompanhada dos try-catches no `api.ts`, a Vercel sempre compila a página. Se não tiver dados externos, injetamos `fallbackDeals.ts` como contingência para que a UI nunca quebre.

## 4. O Sistema "T3-ish" (Arquitetura Modular)
- **Estruturação Funcional:** Componentes não são apenas "caixas burras HTML". Componentes vitrines (como `HistoricalLows` e `EndingSoon`) foram modularizados para conterem seu próprio Fetching interno (data-layer) e o seu próprio CSS Module.
- **O Porquê:** Na Home Page anterior, injetávamos `deals` de todos os tipos via props no componente principal, transformando a raiz na controladora total de dados. A modularização transferiu o "cérebro" para cada Seção. Se a seção de Novidades sumir, a seção de Historical Lows lida em isolamento com a falha dela.

---
**Próximo Passo:** Entenda como a API lida com limitação e tratamento de tráfego no módulo [02. Infraestrutura de API e Serviços (Services)](02-api-and-services.md).
