# GameDeals - Busca de Ofertas Gamer Épicas 🎮

O GameDeals é um agregador de ofertas de jogos state-of-the-art construído com **Next.js 14**, focado em performance, design premium e conversão.

## 🚀 Tecnologias
- **Framework:** Next.js 14 (App Router)
- **Estilização:** CSS Vanilla (Mobile First)
- **Estado Global:** Zustand (Wishlist & Auth)
- **Iconografia:** Lucide-React
- **Animações:** Framer Motion
- **Dados:** CheapShark API + HLTB Simulation
- **Infraestrutura de Produção:** Supabase (Auth/DB) + Vercel (Hospedagem/Cron)

## 🛠️ Configuração de Desenvolvimento

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env.local
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🌐 Deploy para Produção (Vercel + Supabase)

Para colocar o projeto no ar com funcionalidades reais de banco de dados e alertas:

### 1. Supabase (Banco de Dados e Auth)
- Crie um projeto no [Supabase](https://supabase.com/).
- Vá em **Project Settings > API** e copie a `URL` e a `anon key`.
- Insira-as no seu arquivo `.env.local` (ou nas Environment Variables da Vercel).
- Execute as queries SQL (fornecidas no `implementation_plan.md`) no SQL Editor do Supabase para criar as tabelas de `profiles`, `wishlists` e `alerts`.

### 2. Vercel (Hospedagem)
- Conecte seu repositório GitHub à [Vercel](https://vercel.com/).
- Adicione as variáveis de ambiente necessárias.
- O deploy será automático a cada `push`.

### 3. Alertas de Preço (Cron Jobs)
- Na Vercel, habilite o suporte a **Cron Jobs**.
- O endpoint `/api/cron/check-alerts` será chamado automaticamente para processar os envios de e-mail de ofertas.

## 📈 Monetização
O sistema utiliza um redirecionador inteligente em `/out` que injeta automaticamente seus IDs de afiliado. Configure seus IDs no arquivo `src/app/out/OutRedirector.tsx`.

---
Desenvolvido com ❤️ pela equipe GameDeals.
