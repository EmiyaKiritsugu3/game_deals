# Sprint 10 — Security & Trust (Phase A) — UPDATED

## Objetivo
Fechar os últimos gaps P0 de segurança: cron schedule, rate limiter distribuído, CI cleanup.

## Estado Real (audited 2026-06-20)
PRD estava extremamente desatualizado. Maioria dos P0/P1 já implementado:

| Item | Status |
|------|--------|
| Sentry error monitoring | ✅ @sentry/nextjs v10.58, withSentryConfig, 3 config files |
| Alerts dual-storage fix | ✅ PR #23 — server-first, atomic delete |
| deletePriceAlertAction atomic | ✅ Já usa DELETE com RETURNING em query única |
| Portuguese strings | ✅ 0 matches encontrados |
| Sitemap game detail | ✅ Já consulta DB para games |
| PWA manifest + favicon | ✅ Ambos existem |
| Wishlist cloud sync | ✅ SyncManager tem loadCloudWishlist |
| Complexity suppressions | ✅ 0 fallow-ignore restantes |

## Entregas Restantes

### Track 1: Cron Schedule Triggers (2h) — P0
| Item | Arquivo | Ação |
|------|---------|------|
| Adicionar crons config | `vercel.json` | Configurar schedules para 3 endpoints |
| Price ingestion | `src/app/api/cron/ingest-prices/route.ts` | `0 * * * *` (a cada hora) |
| Typesense reindex | `src/app/api/cron/reindex-typesense/route.ts` | `0 3 * * *` (3am UTC diário) |
| Alert check | `src/app/api/cron/check-alerts/route.ts` | `0 * * * *` (a cada hora) |

**Nota**: Vercel Cron Jobs usam GET requests. Todos os routes já exportam GET. CRON_SECRET header check já implementado em todos.

### Track 2: Rate Limiter Upstash (1d) — P0
| Item | Arquivo | Ação |
|------|---------|------|
| Instalar deps | `package.json` | `pnpm add @upstash/ratelimit @upstash/redis` |
| Migrar rate limiter | `src/lib/rate-limit.ts` | Substituir PostgreSQL advisory locks por Upstash Redis |
| Fallback graceful | `src/lib/rate-limit.ts` | Se Upstash indisponível, fallback para PostgreSQL |
| Variáveis de ambiente | `.env.example` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Testes | `tests/unit/lib/rate-limit.test.ts` | Mock Upstash, verificar limit/fallback |

**API atual**: `rateLimit(key, maxAttempts, windowMs)` → boolean
**Consumidores**: `src/app/auth/callback/route.ts` (rateLimit por IP)

### Track 3: CI continue-on-error Cleanup (30min) — P1
| Item | Arquivo | Linhas | Ação |
|------|---------|--------|------|
| Remover continue-on-error | `.github/workflows/ci.yml` | 53, 55, 69 | Remover ou justificar |
| Remover continue-on-error | `.github/workflows/nightly.yml` | 77, 80, 123 | Remover ou justificar |

## Ordem de Execução
1. Track 1 (cron) — rápido, desbloqueia automação
2. Track 3 (CI) — rápido, melhora qualidade
3. Track 2 (rate limiter) — maior esforço

## Meta
- 3 cron endpoints com schedule automático via vercel.json
- Rate limiter distribuído via Upstash Redis com fallback PostgreSQL
- CI sem continue-on-error
- Todos os testes existentes continuando passando
- Novos testes: ~5-10

## Variáveis de Ambiente Necessárias
```
UPSTASH_REDIS_REST_URL=    # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=  # Upstash Redis REST token
```
