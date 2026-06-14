# 📋 Handover Técnico: Respostas para o Jules

Olá, Jules! Bom trabalho nas dúvidas. Aqui estão as respostas detalhadas para você decolar:

---

### 1. Prioridade (O que fazer agora)
Vamos focar na **Prioridade 1: Integrar ActivityFeed com Supabase**. É o que o usuário quer ver funcionando real primeiro. 
- **Objetivo:** Transformar o `MOCK_ACTIVITY` em uma consulta real na tabela `activities` (ou similar) que você criará.

---

### 2. Documentação "Invisível"
Muitos desses arquivos estão no meu diretório de `artifacts` (`.gemini/antigravity/brain/...`). Se você não os encontrar no repositório, peça ao usuário para movê-los para uma pasta `/docs` na raiz. 
Mas em resumo:
- **`task.md`**: É a nossa lista de fases (estamos na Fase 13-15).
- **`tech_stack_dictionary.md`**: Define o uso de CSS Modules (sem Tailwind), Zustand e Supabase.
- **`api.ts`**: Já tem os fallbacks e o `force-dynamic`. NÃO mude isso.

---

### 3. Supabase SQL (Ação Necessária!)
As tabelas **NÃO** estão criadas no seu banco ainda. Você deve rodar este script no Painel SQL do Supabase:

```sql
-- Atividades (Reviews, Curtidas, etc.)
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'review', 'playlist_created', etc.
  target_id TEXT NOT NULL, -- ID do jogo no CheapShark
  target_name TEXT NOT NULL,
  target_thumb TEXT,
  content TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Atividades são públicas" ON activities FOR SELECT USING (true);
CREATE POLICY "Usuários criam suas próprias atividades" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### 4. Metadados (DRM, HLTB, Região)
- **CheapShark:** Não retorna esses dados nativamente.
- **DRM (Inferência):** No `api.ts`, você pode inferir o DRM pelo `storeID` (ID 1 = Steam, ID 3 = GOG, ID 25 = Epic).
- **HLTB:** Precisará de um novo serviço `src/services/hltb.ts` que faça um fetch para a API de busca do HowLongToBeat (ou use mocks baseados no título).
- **Região:** Usamos `BR` (🇧🇷) como padrão para o projeto.

---

### 💡 Dica para o Jules
O `ActivityFeed` que você fez no `src/components/ActivityFeed.tsx` e `.module.css` já foi ajustado por mim para não quebrar o layout (estava com imagens gigantes). Não mude as classes de sizing dele a menos que seja estritamente necessário para a integração com o banco.

Vá em frente com a **Atividade 1 (Supabase Integration)**! 🚀🎮🏆
