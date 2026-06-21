---
title: Gamification Implementation Plan (SUPERSEDED)
type: plan
status: superseded
scope: project
tags:
  - gamification
  - plan
  - archived
related:
  - adr/ADR-007-gamification-system
updated: "2026-06-21"
---

# Implementation Plan: Phase 19 - Gamification & Social Foundation

Este plano detalha a infraestrutura para transformar o GameDeals em uma plataforma social gamificada, focando em conquistas (badges) e engajamento.

## User Review Required

> [!IMPORTANT]
> A gamificação exigirá novas tabelas no Supabase para rastrear métricas dos usuários em tempo real. Precisaremos garantir que as permissões (RLS) estejam configuradas para evitar que usuários "trapacem" nas conquistas.

## Proposed Changes

### [Database] Supabase Schema Evolution

#### [NEW] `badges`
Tabela mestre de insignias disponíveis.
- `id`: UUID (Primary Key)
- `name`: Text (ex: "Playlist Master")
- `description`: Text (ex: "Created 10 public playlists")
- `icon_svg`: Text (Armazena o código SVG do ícone para carregamento instantâneo)
- `rarity`: Enum (Common, Rare, Epic, Legendary)

#### [NEW] `user_stats`
Tabela para rastrear métricas de gamificação sem recalcular tudo toda hora.
- `user_id`: UUID (Foreign Key to auth.users)
- `playlists_count`: Int (Default 0)
- `reviews_count`: Int (Default 0)
- `xp`: Int (Para futuros níveis)

#### [NEW] `user_badges`
Relação de insignias conquistadas.
- `user_id`: UUID
- `badge_id`: UUID
- `awarded_at`: Timestamp

---

### [Logic] Achievement Triggering
Implementaremos uma lógica no momento da gravação de dados:
1.  **Trigger**: Usuário salva uma nova Playlist.
2.  **Action**: Incrementa `playlists_count` em `user_stats`.
3.  **Check**: Se `playlists_count == 10`, insere registro em `user_badges` caso não exista.

---

### [UI] Social Components

#### [NEW] `ProfileHeader.tsx`
Exibirá o nome do usuário, avatar e uma linha horizontal com os ícones das **Insignias** conquistadas.

#### [NEW] `AchievementToast.tsx`
Uma notificação visual premium (fundo gradiente, animação de partículas) que aparece no canto da tela no exato momento em que o usuário ganha uma insignias.

## Verification Plan

### Automated Tests
- Simular a criação de 10 listas via script e verificar se o registro de badge aparece no banco de dados.

### Manual Verification
- Testar o fluxo de "conquista" e verificar se o Toast de celebração aparece corretamente.
