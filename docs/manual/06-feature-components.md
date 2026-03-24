# 🚀 06. Feature Components

Componentes maiores que carregam inteligência de negócio independente. Eles podem viver, morrer ou quebrar sozinhos sem derrubar a tela (Graças à arquitetura Vercel/Next).

## 1. Historical Lows (`src/components/HistoricalLows.tsx`)
- **Componente Servidor (Server Component):** Trabalha de forma assíncrona pura.
- **A Mágica da Lógica:** 
  A CheapShark API devolve vitrines de jogos em promoção, mas não avisa proativamente quais bateram o preço histórico. Esse componente:
  1. Chama `Promise.all` para buscar os jogos mais recentes, os classificados e os melhores descontos.
  2. Associa todos os arrays e remove as cópias do mesmo ID (`Array.from(new Map(...).values())`).
  3. Varre a lista perguntando a cada jogo `getGame(id)` o seu `cheapestPriceEver`.
  4. Verifica se a conta do `deal.price` <= (`cheapestPriceEver + 5% de tolerância da flutuação cambial de Grey Market`).
- **CSS Module e UI:** Encapsulado do resto do site para evitar conflito com os cards normais da home.

## 2. ActivityFeed (`src/components/ActivityFeed.tsx`)
A engrenagem do engajamento (Fase 19).
- **Abordagem Reativa:** Criado inicialmente como Mock, agora integrado na Gamificação. 
- **O Design Pattern:** Cada bolha do feed possui animações em cascata. Ao invés de poluir os outros componentes com lógicas sociais lentas, a barra lateral apenas puxa relatórios de `src/services/social.ts` e renderiza toasts orgânicos sempre que o evento "Master Playlist Achieved" ressoa do banco.

## 3. Dynamic Charts (`src/components/DynamicCharts.tsx`)
- **Desempenho Estrito:** Este componente renderiza a biblioteca externa "Recharts".
- **A Decisão do Lazy Loading:** Para evitar empacotar bibliotecas monstruosas de SVG no bundle inicial carregado pelos usuários, no arquivo nós os importamos como:
  ```typescript
  import dynamic from 'next/dynamic';
  const DynamicCharts = dynamic(() => import('@/components/Charts'), { ssr: false });
  ```
  Gráficos interativos não devem ser "pre-renderizados" no backend pois são impossíveis de clicar em Server Side, portanto economizamos o parse de memória da máquina.

## 4. Freebies (`src/components/Freebies.tsx`)
- **Query Hardcoded:** Simplesmente chama `getDeals({ upperPrice: "0" })`.
- **Tratamento de Vazio:** Se nenhum jogo grátis existir no ecossistema global na data atual, o componente retorna `null`, garantindo que a Home Page collapse aquela linha de interface automaticamente graças ao Flexbox estrutural (`page.module.css`).

---
🎉 **Parabéns!**  
Você leu o Manual Enciclopédico. Você agora possui a estrutura mental e o raciocínio completo necessário para entender, expandir e recriar o projeto *GameDeals* do zero, desde a estática do banco até os reflexos de um píxel do CSS Vanilla.
