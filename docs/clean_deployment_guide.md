# 🧹 Guia para um Novo Deploy (Vercel Clean Start)

Como o plano **Hobby** da Vercel é muito restrito com identidades de bots, o melhor caminho é você mesmo fazer o push final para garantir que o seu GitHub seja reconhecido como o único autor.

### 1. Limpeza no Vercel
1. Vá ao [Vercel Dashboard](https://vercel.com/dashboard).
2. Selecione o projeto `game-deals`.
3. Vá em **Settings** > **General** > Scroll até o final e clique em **Delete**.

---

### 2. Configurações Locais de Identidade
Garanta que o Git local está configurado com o seu e-mail e nome oficiais do GitHub:

```bash
git config --global user.email "seu-email@exemplo.com"
git config --global user.name "SeuNome"
```

---

### 3. O "Push" de Ouro (Faça Você Mesmo)
Para evitar que o Vercel bloqueie o deploy novamente, **você deve executar o comando abaixo no seu terminal local**:

```bash
git add .
git commit -m "feat: clean production deployment with analytics"
git push origin main --force
```

---

### 4. Criando o Novo Projeto na Vercel
1. No Vercel, clique em **Add New** > **Project**.
2. Importe o repositório `game-deals`.
3. **IMPORTANTE:** Em "Environment Variables", adicione novamente as chaves do Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Clique em **Deploy**.

---

### ✅ Por que isso resolve?
Ao fazer o push manualmente pelo seu terminal, o GitHub associa o commit e a ação de "push" diretamente à sua conta física. O robô (eu) já preparou todo o código (Analytics, Fallbacks, Estilos corrigidos), então o deploy agora deve passar liso.
