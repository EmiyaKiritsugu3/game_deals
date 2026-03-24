# 🌐 02. Infraestrutura de API e Serviços

Esta seção detalha como o GameDeals se comunica com o mundo exterior. A fundação de dados do projeto repousa sobre a resiliência e a proteção contra *rate limits*.

## 1. CheapShark API (`src/services/api.ts`)
O núcleo do GameDeals é alimentado pela API da CheapShark. As seguintes métricas orientam nossa arquitetura:

- **Estratégia de Caching (`revalidate`)**
  - O Next.js nativamente cacheia as respostas do `fetch()`. Em `getDeals()`, definimos `revalidate: 3600` (1 hora). 
  - Em `getStores()`, definimos `revalidate: 86400` (24 horas), visto que lojas raramente mudam.
  - **O Porquê:** A API da CheapShark é rigorosa contra *spam*. Se não usássemos o cache agressivo do Next.js, os acessos simultâneos de centenas de usuários em nossa Home Page causariam o bloqueio imediato do IP do servidor Vercel (HTTP 429 Too Many Requests). O cache blinda nossa API externa.

- **A Geração de Grey Markets**
  - Lojas não-oficiais (Keyshops) não são retornadas de modo nativo unificado. Em `api.ts`, criamos a heurística `isGreyMarketStore()` que mapeia lojas com ID acima de `100` (ex: Kinguin, Eneba) e as injetamos ativamente via `generateGreyMarketDeals` nas páginas de detalhe para comparação total de preços.

- **Resiliência e Fallbacks Assíncronos**
  - **O Problema:** Durante a compilação do Next.js estático (`next build`), se a CheapShark sofresse um *timeout*, todo o deploy da Vercel falhava.
  - **A Solução:** Envolvemos o `fetch` em pesados blocos `try/catch`. Caso `res.ok` falhe (ou lance exceção), nós interceptamos o erro antes do Next.js crashar a renderização, e forçadamente retornamos a constante estática `fallbackDeals` (que reside localmente na nossa pasta `src/data/`). A UI renderiza deals antigos pacificamente e o usuário nunca vê a "Tela Branca da Morte" (White Screen of Death).

## 2. Scraping Acessório (`src/services/hltb.ts`)
- **O Porquê:** Como a CheapShark não provê dados sobre tempo estimado de zeramento dos jogos, construímos um mini scraper para o HowLongToBeat (`hltb.ts`).
- **Limitações:** Por ser um Web Scraper, ele é extremamente suscetível a mudanças de recesso no HTML do site-alvo. Nós encapsulamos esse serviço puramente na `Game Details Page`, longe da Home, para não comprometer a Performance Inicial (FCP - First Contentful Paint).

## 3. O Ponto de Entrada para Games Dinâmicos (`getGame`)
- No método `getGame(id: string)` localizado dentro de `api.ts`, fazemos uma manipulação cirúrgica da resposta bruta. Quando a CheapShark nos envia as "Deals" de um jogo específico, nós recanalizamos os preços, injetamos as lojas de grey market e re-calculamos manualmente a propriedade interna `game.cheapestPriceEver`. 
- **Por que fazemos o recálculo mental?**
  Muitas vezes a CheapShark falha em registrar o *Historical Low* se a promoção ocorreu num Grey Market escuro ontem. Ao compararmos em tempo real, corrigimos a distorção no front-end.

---
**Próximo Passo:** Entenda como o backend entra em jogo para salvar os perfis dos usuários e aplicar a gamificação no módulo [03. Gamificação e Estado Global](03-gamification-and-state.md).
