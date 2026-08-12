# Plano de Correção e Otimização — Game Deals

Data: 2026-08-11 · Base: auditoria completa (ver `audit-report-2026-08-11.html`)
Score atual: 72/100 · Meta: 88+

## Execução

Fases sequenciais. Cada fase: 1 PR, CI verde, critério de done explícito.
Nunca commitar em `main` — branch + PR (workflow do repo).
Fixes XSS primeiro, limpeza depois.

---

## FASE 1 — Segurança crítica (XSS + hygiene git) · ~1h

### 1.1 Fix XSS JSON-LD — CRITICAL
- Arquivo: `src/app/game/[id]/page.tsx:99`
- Vetor: `dangerouslySetInnerHTML` com `JSON.stringify` — título do CheapShark
  não-saneado; `JSON.stringify` não escapa `<` → `<script>` injection
- Fix preferido: escapar `<` antes de stringify
  ```ts
  const jsonLdSafe = JSON.stringify(productJsonLd).replace(/</g, '\\u003c');
  ```
- Alternativa aceitável: remover bloco JSON-LD (SEO marginal vs risco)
- OBS: 8 PRs abertos (#153, #156, #157, #158, #160, #162 +2) com esse fix —
  avaliar merge de 1 deles em vez de reescrever
- Teste: adicionar caso em `src/app/game/[id]/` (título com `</script>` não
  quebra bloco)
- **Done:** build verde, teste novo passando, 1 PR merged

### 1.2 Remover `.omo/` do git — HIGH
```bash
git rm -r --cached .omo
# .gitignore += linha: .omo/
rm -rf .omo
```
- 9 branches merged deletáveis (feat/new-ui-clean, sprint-*, etc.)
- **Done:** `git status` limpo, lint passa (`biome check .` sem erro do .omo)

---

## FASE 2 — Rate limiting + RLS · ~3h

### 2.1 Rate limit nas server actions — HIGH
- Helper existe: `src/lib/rate-limit.ts` (Upstash) — só no auth callback hoje
- Aplicar em: `src/actions/*` (8 actions: deals, search, alerts, playlists,
  ratings, notifications)
- Padrão: wrap no topo de cada action, key por usuário/IP
- **Done:** todas actions protegidas, teste de 429, CI verde

### 2.2 RLS nas tabelas user-scoped — HIGH
- Hoje: `CREATE POLICY` só em 0005 (notifications) e 0013 (user_stats)
- Migration `0016_rls.sql`: enable RLS + policies por `userId` em:
  playlists, price_alerts, ratings, gamification, users, views
- Cuidado: verificar fluxo server-side (service role bypass OK)
- **Done:** migration aplicada, testes de acesso cross-user, build verde

---

## FASE 3 — Env + dependências · ~1h

### 3.1 Sincronizar .env.example — HIGH
- Código lê 9 vars ausentes no .env.example:
  `SUPABASE_SERVICE_ROLE_KEY, SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_TYPESENSE_URL,
  MCP_SUPABASE_API_KEY`
- Adicionar com placeholders. Remover vars mortas (NEXT_PUBLIC_TYPESENSE_URL
  vs TYPESENSE_HOST/PORT/PROTOCOL — verificar qual real)
- **Done:** diff código↔example zero

### 3.2 Scripts e deps — MEDIUM
- `package.json`: `"audit": "bun audit"` (1 linha — hoje npm audit → ENOLOCK)
- Remover `eslint` de devDeps (Biome é linter real, sem config eslint)
- `bun update undici jsdom` quando corrigidas (GHSA dev-only)
- **Done:** `bun run audit` passa, knip sem eslint

---

## FASE 4 — Versionamento + branches · ~1h

- Cortar tag: `git tag v0.11.0` no HEAD atual (ou corrigir CHANGELOG)
- package.json version → 0.11.0 (hoje 0.1.0)
- Deletar 9 branches merged locais + podar remote-only órfãos
- **Done:** tags, version, CHANGELOG consistentes; branches < 12

---

## FASE 5 — Dead code + docs · ~2h

### 5.1 Knip 22 exports mortos — MEDIUM
- Remover: SheetClose/SheetFooter, TooltipTrigger, useGameSearch/useDebounce,
  normalizeTitle/findVariants, computeSavings/isPriceFree/isEpicDealCheck/
  isHistoricalLowCheck, interfaces locais
- **Done:** knip 0 unused, testes passam

### 5.2 Docs órfãos — LOW
- Mover p/ `docs/archive/`: development_plan, gamification_plan,
  implementation_plan, jules_deployment_handover
- Atualizar README (menciona pnpm?) — verificar
- **Done:** docs raiz refletem estado atual

---

## FASE 6 — Otimização (opcional, pós-fixes) · ~3h

- `<img>` crus → next/image com lazy (3 em produção: filter-bar, compare-tray,
  AlertCard)
- 7 `any` sem biome-ignore → tipar ou comentar
- Lazy-load Recharts? (hoje isolado em Charts.tsx — avaliar impacto bundle)
- **Done:** build verde, bundle menor

---

## Critérios de aceite finais

- `bun run lint` → 0 erros
- `bun run test` → 1074+ passando
- `bun --bun next build` → verde
- `bun run knip` → 0 unused exports
- `bun run audit` → sem high/critical (dev-only mitigado)
- Tag v0.11.0 cortada, version package = CHANGELOG
- `.env.example` = leituras reais do código

## Riscos

- RLS pode quebrar fluxo server-side (service role) — testar E2E antes de merge
- Rate limit pode afetar usuários legítimos (busca intensa) — threshold alto
- Merge de PR XSS externo: revisar diff antes (pode ter side effects)
