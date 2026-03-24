# 🛤️ 04. Roteamento e Páginas (App Router)

A fundação do GameDeals baseia-se na arquitetura moderna de pastas do Next.js 14. Compreender as responsabilidades do Root garante que não quebremos a UX acidentalmente.

## 1. O Root Layout (`src/app/layout.tsx`)
- **Responsabilidade Visual:** Ele envelopa toda a aplicação no Navbar global global e aplica a fonte `Inter`.
- **A Injeção de Analytics:** No final do `<body>`, incluímos estaticamente `<Analytics />` e `<SpeedInsights />` da Vercel. 
- **O Slot do Modal Periférico:** Uma das partes cruciais do layout é receber o prop estrito `{ modal: React.ReactNode }`. Sem ele, a nossa navegação profunda (*Intercepting Routes*) de exibir modais por cima de outras rotas não existiria.
- **SyncManager:** Acoplado aqui em cima para ouvir as mudanças de estado da sessão global no Zustand invisivelmente.

## 2. Feedback Global de UX (`src/app/loading.tsx`)
- **O Porquê:** Quando o usuário clica em qualquer link Next.js (como as buscas ou ir para os detalhes de um jogo pesado), o React Server Component segura o paint (desenho) da tela na requisição SSR. O usuário achava que o site tinha travado.
- **A Solução:** O `loading.tsx` na raiz do `/app` captura automaticamente esses momentos de bloqueio transitório do React Suspense. Ele renderiza a classe `.spinner` giratória instantaneamente, dando alívio visual enquanto a API remota busca os dados.

## 3. A Estratégia da Home Page (`src/app/page.tsx`)
- **Paralelização Massiva:** Em vez de fazer:
  ```typescript
  const popular = await getDeals(...);
  const flash = await getDeals(...);
  ```
  Isso causaria um *Waterfall* onde cada chamada aguarda a anterior. Nós unificamos todas as seções pesadas via `Promise.all`.
  - **O Impacto:** O tempo da requisição Total cai de (Req1 + Req2 + Req3...) para o tempo **apenas da requisição mais longa**, diminuindo absurdamente o Server Response Time (TTFB).

- **Tratamento Híbrido de Componentes:** 
  A Home Page lida com o conteúdo crítico (Hero, New Deals) ali mesmo, injetando Props. Porém, logo abaixo, invocamos `<HistoricalLows />` e `<EndingSoon />` sem lhes passar uma única Prop. 
  - **O Porquê:** Estes dois componentes são módulos autossuficientes. Eles disparam seus próprios `getDeals()` independentemente da `Promise.all` global, reduzindo o tamanho do arquivo `page.tsx` para mantê-lo focado em mapeamento.

## 4. Mergulho Fundo (Intercepting / Parallel Routes)
- Caminho: `src/app/@modal/(.)game/[id]/page.tsx`
- **A Lógica:** Quando o usuário de desktop clica em um GameCard, o Next vaza do roteamento normal de abrir `/game/123` e empurra o conteúdo da rota interceptada por cima da página atual. Uma técnica vital para evitar comutação de página pesada. Um F5 (Refresh) rompe o modelo e renderiza o jogo na rota primária estática (`src/app/game/[id]/page.tsx`), perfeitamente compatível com SEO clássico.

---
**Próximo Passo:** Vamos dissecar a fundo os botões, cards e o lendário Hero Section no módulo [05. Core UI Components](05-core-components.md).
