---
title: Jules Evolution Plan (SUPERSEDED)
type: agent-plan
status: superseded
scope: project
tags:
  - jules
  - evolution
  - archived
related:
  - archive/jules_master_onboarding
updated: "2026-06-21"
---

# 🌐 GameDeals Evolution: Global Social Discovery Platform

Este documento define a visão de longo prazo e o prompt técnico para a próxima fase do projeto, transformando-o em uma plataforma global de curadoria e rede social para gamers.

---

## 📝 Prompt Mestre para o Jules:

> **Objetivo de Alto Nível:**
> Evoluir o GameDeals de um agregador de ofertas para uma **Plataforma Social Global de Descoberta de Jogos** (estilo "Letterboxd para games"). O foco mudou do mercado local para o **mercado Global**.
>
> **O que já construímos:**
> - Next.js 14 (App Router), interceptação de rotas para detalhes de jogos.
> - Autenticação real com Supabase (Google/Discord).
> - Sistema de Alertas de Preço (Vercel Cron + Supabase).
> - Resiliência de API: Fallback para dados curados quando a API CheapShark falha.
>
> **Missão do Jules (Fase de Evolução):**
> 1. **Revisão e Refatoração:** Realize uma auditoria completa do código. O arquivo `src/services/api.ts` está muito denso; separe as preocupações em módulos (CheapShark Service, Supabase Service, Business Logic).
> 2. **Motor Social (Back-end):** Proponha e implemente a estrutura de banco de dados (Supabase) para:
>    - **Reviews:** Usuários devem poder escrever análises e dar notas.
>    - **Playlists:** Usuários devem poder criar coleções públicas (ex: "Best Roguelikes for Steam Deck").
>    - **Perfil Público:** Uma página `/user/[username]` que exibe a atividade e as listas do usuário.
> 3. **Internacionalização (i18n):** Prepare o projeto para múltiplos idiomas e moedas.
> 4. **UX de Comunidade:** Proponha componentes de UI para um "Activity Feed" global na home page, mostrando os últimos jogos favoritados e reviews escritos pela comunidade.
> 5. **Engenharia de Performance:** Melhore a estratégia de cache (ISR/On-demand Revalidation) para lidar com tráfego global sem estourar os limites da API gratuita.

---

## 🎯 Metas Estratégicas

### 1. Social & Engajamento
- **Reviews:** Permitir que o usuário deixe uma opinião rápida sobre o jogo.
- **Recomendação Algorítmica:** Sugerir jogos baseados na wishlist e nas playlists do usuário.
- **Sistema de Seguidores:** Criar uma rede de curadores de ofertas dentro da plataforma.

### 2. Expansão de Dados
- **Múltiplas APIs:** Além do CheapShark, integrar dados de outras fontes para garantir que o "Histórico de Preços" e a disponibilidade sejam globais.
- **Metadados Sociais:** Buscar capas de alta qualidade e trailers para tornar os perfis e listas visualmente ricos.

### 3. Escala Global
- **Multi-Currency:** Conversão automática de preços baseada na geolocalização do usuário.
- **SEO Social:** Garantir que Playlists de usuários sejam indexáveis pelo Google para atrair tráfego orgânico.

---

## 🏗️ Arquitetura Atual (Referência)
- **Framework:** Next.js 14.
- **State Management:** Zustand (Wishlist & Auth).
- **Database/Auth:** Supabase.
- **Deployment:** Vercel.
- **Página Crítica:** `src/app/page.tsx` (agora forçada como `dynamic = 'force-dynamic'`).
