# 🏆 03. Gamificação e Gerenciamento de Estado

A Fase 19 transformou o GameDeals de um agregador passivo para uma rede viva e engajada. 

## 1. Zustand (Gerenciamento de Estado Global)
- **A Decisão:** Por que usamos Zustand e não Context API pura ou Redux? 
- **O Porquê:** O React Context causa re-renderizações em cascata massivas caso não seja rigorosamente memoizado com `useMemo`. O Redux tem *boilerplate* demais para necessidades simples. Zustand nos dá lojas (stores) leves e isoladas:
  - `authStore.ts`: Gerencia o estado reativo da sessão do usuário (Session e User JWT do Supabase).
  - `wishlistStore.ts`: Mantém o array de IDs de jogos locais sincronizado.
  - `alertStore.ts`: Lida com os *Price Alerts* que disparam o cron job via Next.js `/api/cron/check-alerts`.

## 2. Serviço Social & "Playlists" (`src/services/social.ts`)
- O motor de listas está ancorado no Supabase. 
- **Como Funciona:** Em vez de forçar uma tabela pivot para "Lista X tem Jogo Y e Z", armazenamos um array de strings (`games_ids`) direto na linha da Playlist via PostgreSQL Arrays.
- **O Porquê:** Nossa escala (jogos favoritos do usuário) envolve poucos dados textuais (apenas IDs da CheapShark). Arrays nativos poupam JOINs pesados e aceleram o retorno das playlists no Front-end drasticamente. 
- O método `addGameToPlaylist` intercepta possíveis duplicações antes de modificar a nuvem.

## 3. O Motor de Gamificação (Badges & Stats)
- A tabela `user_stats` centraliza a matemática relacional do usuário. Quando ele atinge `playlists_count >= 10`, o método **`checkAchievements`** (localizado em `social.ts`) desperta.
- O sistema varre silenciosamente a meta (ex: *Playlist Master*) e insere a insignia na Pivot Table `user_badges`. Se ocorrer o erro de duplicidade do Postgres (`throw error 23505`), nós sabemos que a Badge já existia e ignoramos suavemente. 
- **Foco Técnico:** O Front-end requisita `getUserBadges` e popula o perfil do usuário, incentivando colecionismo retroativo de promoções históricas. 

---
**Próximo Passo:** Entenda como as engrenagens de UI seguram tudo isso estruturalmente na seção [04. Roteamento e Páginas (App Router)](04-pages-routing.md).
