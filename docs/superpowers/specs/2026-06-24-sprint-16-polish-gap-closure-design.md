# Sprint 16 — Polimento & Gap Closure

**Date:** 2026-06-24
**Version:** v0.7.0
**Status:** Draft → Approved → Merged

## Motivation

Sprint 15 shipped gamification, PWA, profile/leaderboard (v0.6.0, 980 tests). Original spec scoped 11 items based on PRD gaps. Audit revealed 6 items already resolved by recent PRs — rate limiter (Upstash+PG), sitemap (game URLs), SyncManager (cloud→local), complexity suppressions (zero), lint-staged, i18n (except CookieBanner). This spec reflects verified remaining gaps only.

Real scope: ~3h total. Ratchet not feature — each item closes a tracked gap with zero regression risk.

## Scope

### Phase A — Já Feito (removido do plano)

| Item | Status | Nota |
|------|--------|------|
| PR #53 merge | ✅ Mergado | Sentinel timing fix |
| PR #54 merge | ✅ Mergado | Bolt batched fetching |
| lint-staged .md | ✅ Já limpo | Sem pattern md |
| Rate limiter | ✅ Já distribuído | Upstash Redis + PG fallback |
| Sitemap game URLs | ✅ Já implementado | Busca DB 50k games |
| SyncManager cloud→local | ✅ Já readicionado | useEffect monta wishlist |
| Complexity suppressions | ✅ Zero restam | Todos resolvidos |

### Fase B — Pendentes Verificados (~3h)

| Item | Prio | Esforço | Detalhe |
|------|------|---------|---------|
| **B1.** Security headers | P0 | 1.5h | Middleware (`src/utils/supabase/middleware.ts`) define **zero** security headers. PRD N-SC-5. Adicionar: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |
| **B2.** Drizzle snapshot 0012 | P2 | 5min | `_journal.json` idx 12 (`0012_deals_unique_constraint`) — snapshot file **ausente** no disco. `pnpm db:generate` deve preencher. |
| **B3.** GitHub OAuth button | P3 | 15min | `handleSocialLogin` aceita `'github'` mas JSX em `AuthModal.tsx` só mostra Google + Discord. Adicionar botão. |
| **B4.** i18n — PT→EN CookieBanner | P1 | 10min | `src/components/CookieBanner.tsx`: "Aceitar" e "Rejeitar" em português. Traduzir. |
| **B5.** PRD sync | P1 | 30min | PRD ainda marca 6 features como "Not Built" / "Partial" que já estão prontas. Atualizar status. |

### Fase C — Stretch (opt-in)

| Item | Prio | Esforço | Detalhe |
|------|------|---------|---------|
| **C1.** i18n varredura completa | P3 | 1h | Busca sistemática por strings hardcoded em PT em todos `.tsx` + `.ts`. |
| **C2.** Custom analytics events | P2 | 2d | Vercel Web Analytics eventos custom: clicks afiliados, alertas, busca. |
| **C3.** RSS/Atom feed | P3 | 1d | `/api/rss` com deals. ISR, revalidate 1h. |

## Test Strategy

- Existing suite (980+ tests) gates all changes
- B1 (headers) — testável via `app/api/...` ou middleware test
- B2 — sem test novo (regeneração de snapshot)
- B3 — idealmente test visual/component (mas sem E2E pra AuthModal existente, aceito sem)
- B4 — troca de string, test puramente visual

## Risco

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| B1 CSP quebra inline styles/libs | Médio | Testar em preview Vercel antes prod |
| B3 button sem Supabase config | Baixo | Código já lida com `provider not configured` |
| B5 PRD atualização perde contexto | Baixo | Git trackeia diff, fácil reverter |

## Definition of Done

- [ ] B1-B5 completos
- [ ] 0 regressões — `pnpm test` passa
- [ ] 0 PRs abertos no repo
- [ ] PRD atualizado com status real de cada gap
