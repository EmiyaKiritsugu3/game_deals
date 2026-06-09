# Architecture Decision Records (ADRs)

Este diretório contém os registros de decisões arquiteturais do projeto GameDeals.

## Formato

Cada ADR segue o padrão:
- **Título**: ADR-XXX: [Título da Decisão]
- **Status**: Proposto | Aceito | Rejeitado | Substituído | Obsoleto
- **Contexto**: Qual o problema/necessidade
- **Decisão**: O que foi decidido
- **Consequências**: Prós, contras, trade-offs

## Índice

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [ADR-001](ADR-001-tech-stack.md) | Tech Stack: Next.js 14, TypeScript, CSS Modules, Supabase | Aceito | 2026-06-09 |
| [ADR-002](ADR-002-data-source-strategy.md) | Data Source: CheapShark API + Simulated Keyshops | Aceito | 2026-06-09 |
| [ADR-003](ADR-003-state-management.md) | State Management: Zustand + SWR | Aceito | 2026-06-09 |
| [ADR-004](ADR-004-auth-backend.md) | Auth & Backend: Supabase (PostgreSQL + Auth) | Aceito | 2026-06-09 |
| [ADR-005](ADR-005-deployment-strategy.md) | Deployment: Vercel com SSR Fallback | Aceito | 2026-06-09 |
| [ADR-006](ADR-006-affiliate-monetization.md) | Monetização: Affiliate Cloaking Gateway (/out) | Aceito | 2026-06-09 |
| [ADR-007](ADR-007-gamification-system.md) | Gamificação: Badges, XP, Playlists, Social | Proposto | 2026-06-09 |
| [ADR-008](ADR-008-routing-pattern.md) | Routing: Intercepting Routes para Sidebar Modal | Aceito | 2026-06-09 |
| [ADR-009](ADR-009-price-history-storage.md) | Price History: TimescaleDB/PostgreSQL para séries temporais | Proposto | 2026-06-09 |
| [ADR-010](ADR-010-search-architecture.md) | Search: Meilisearch para busca full-text de jogos | Proposto | 2026-06-09 |

## Como adicionar um novo ADR

1. Copie o template `TEMPLATE.md` (se existir) ou use um ADR existente como base
2. Numere sequencialmente (ADR-XXX)
3. Atualize este README com a nova entrada
4. Commit com mensagem: `docs(adr): add ADR-XXX - [Título]`