# 🤖 Jules Master Onboarding: GameDeals Evolution

Olá, Jules! Você está assumindo o projeto **GameDeals**, um agregador de ofertas de jogos "Premium" focado em UX, performance e fidelidade visual.

### 🎯 Sua Missão
Aprimorar as funcionalidades sociais (Reviews, Playlists, Feed) e expandir a plataforma mantendo a estabilidade de produção.

---

### ⚠️ REGRAS DE OURO (NÃO QUEBRE!)
1.  **NÃO USE TAILWIND CSS:** O projeto usa **Vanilla CSS Modules** exclusivamente. Cada componente deve ter seu `.module.css`. 
2.  **STABILITY FALLBACKS:** O arquivo `src/services/api.ts` contém blocos `try/catch` com dados de fallback (`src/data/fallbackDeals.ts`). **Não remova isso.** É o que mantém o site vivo quando a API externa falha.
3.  **DYNAMIC RENDERING:** A Home Page (`src/app/page.tsx`) possui `export const dynamic = 'force-dynamic'`. Mantenha assim para evitar erros de build na Vercel.
4.  **DEPLOY AUTH:** No plano Hobby da Vercel, nossos pushes são bloqueados. O usuário deve fazer o push final manualmente. **Não tente forçar deploys automáticos via CLI.**

---

### 🏛️ Arquitetura Técnica
- **Framework:** Next.js 14 (App Router).
- **Estilo:** Glassmorphism, Dark Theme, Inter Font.
- **Estado:** Zustand (Global) + SWR (Fetch/Search).
- **Backend:** Supabase (Auth/DB). Chaves no `.env.local`.
- **Rotas:** Intercepting Routes para o Sidebar de detalhes do jogo.

---

### 📂 Documentos Focais (LEIA PRIMEIRO!)
Antes de codar, analise estes arquivos no diretório de artifacts:
1.  **[task.md](file:///home/emiyakiritsugu/.gemini/antigravity/brain/b0b45b07-56a8-4db7-9c5e-e198b84e16e7/task.md):** O progresso atual do projeto.
2.  **[tech_stack_dictionary.md](file:///home/emiyakiritsugu/.gemini/antigravity/brain/b0b45b07-56a8-4db7-9c5e-e198b84e16e7/tech_stack_dictionary.md):** O dicionário técnico completo.
3.  **[activity_feed_fix.md](file:///home/emiyakiritsugu/.gemini/antigravity/brain/b0b45b07-56a8-4db7-9c5e-e198b84e16e7/activity_feed_fix.md):** Lições aprendidas sobre o layout do Feed Social.

---

### 🚀 Roadmap Próximo (O que o usuário quer agora)
- **Melhorar o ActivityFeed:** Atualmente é um protótipo com mock. Precisamos integrar com o Supabase para salvar reviews e curtidas reais.
- **Página de Perfil:** Criar uma área onde o usuário vê sua Wishlist sincronizada e suas atividades.
- **Refinar o Sidebar:** Adicionar mais metadados (DRM, Região, HLTB) que planejamos no `implementation_plan.md`.

### 💡 Dica Estética
Mantenha o design "Gamer Premium". Use `backdrop-filter: blur(12px)`, bordas semitransparentes e ícones da `lucide-react`. Se precisar de imagens de exemplo, use o `generate_image`.

Boa sorte, Jules! Vamos transformar o GameDeals no maior agregador do Brasil. 🚀🎮
