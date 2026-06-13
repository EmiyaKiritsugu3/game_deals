# PR #10 — Correção e Otimização da Quality Pipeline

## TL;DR

> **Quick Summary**: Reverter degradação de qualidade causada pela PR #10 — 4 regras Biome desabilitadas globalmente, 35 supressões inline, knip removendo dependências, globals.css fora do lint. Substituir `"off"` globais por overrides com escopo restrito, resolver causas raiz de cada violação, blindar CI contra recorrência.
>
> **Deliverables**:
> - CI verde: biome check, tsc, vitest, build, knip — 0 erros
> - 4 regras `"off"` globais → overrides com escopo documentado
> - 35 supressões inline → ≤5 (apenas fronteiras de bibliotecas externas)
> - 13 `any` → tipos corretos
> - 8 `<img>` → `<Image>` (optimized onde possível, unoptimized onde necessário)
> - globals.css de volta ao lint do Biome
> - knip.json configurado (tailwindcss, postcss ignorados)
>
> **Estimated Effort**: Large (~6h para executor, ~25 tasks atômicas)
> **Parallel Execution**: YES — 6 waves, 3-5 tasks/wave
> **Critical Path**: Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5 → Wave 6 → Final

---

## Context

### Original Request
PR #10 (quality-pipeline → main) com 55+ arquivos, 3 falhas: Biome lint (60+ erros), Vercel deploy (tailwindcss ausente), SonarCloud quality gate. Relatório de correções anterior documentou tentativa-e-erro mas deixou 4 regras globalmente desabilitadas e 35 supressões inline — qualidade PIOROU.

### Interview Summary
**Key Discussions**:
- Nível 3 (Completo + Processo): Resolver causas raiz E blindar contra recorrência
- Abordagem atômica: 1 task = 1 arquivo/concern, cada wave commitável isoladamente
- Metodologia: verificar antes de executar, validar depois de concluir

**Research Findings** (librarian context7 + explore):
- Biome overrides: `overrides[].includes` (plural), sintaxe validada
- Next.js Image: `import Image from 'next/image'`, props `src, alt, width, height` obrigatórios
- remotePatterns: config `next.config.ts` já tem `img.cheapshark.com` (NÃO `cdn.cheapshark.com`)
- Range suppression: `// biome-ignore-start lint/rule: reason` / `// biome-ignore-end`
- Knip: `ignoreDependencies: ["tailwindcss"]` em knip.json

### Metis Review
**Identified Gaps** (addressed in plan):
- **CRITICAL**: 20+ store favicon CDNs não listados em remotePatterns → usar `unoptimized` para logos/avatares
- **CRITICAL**: `cdn.cheapshark.com` não existe, o correto é `img.cheapshark.com` (já configurado)
- **CRITICAL**: Vercel failure é knip (não CI order) — CI atual já faz lint→build corretamente
- noArrayIndexKey: apenas 2 ocorrências reais (fácil consertar, sem override necessário)
- dangerouslySetInnerHtml: apenas 2 usos (JSON-LD seguro) — override pontual, não global
- Recharts formatters exigem `any` — manter supressão na fronteira da lib
- .forEach em testes (hltb.test.ts) — idiomático, manter com override
- Chave service_role: verificar rotação antes de encerrar

---

## Work Objectives

### Core Objective
Reverter toda degradação de qualidade introduzida pela PR #10, resolvendo causas raiz em vez de suprimir sintomas, e blindar o CI contra recorrência.

### Concrete Deliverables
- `knip.json` com `ignoreDependencies` para tailwindcss
- `biome.json` com `overrides[]` substituindo 4 regras `"off"` globais
- 13 arquivos com `any` → tipos corretos (exceto fronteiras Recharts)
- 8 componentes com `<img>` → `<Image>` (Next.js optimized ou unoptimized)
- `next.config.ts` com remotePatterns atualizados para store favicons
- 5 arquivos com `.forEach()` → `for..of`
- `src/styles/tokens.css` com bloco `@theme` extraído
- `.gitignore` sem `src/app/globals.css`
- GitHub issues de tracking para dívida restante

### Definition of Done
- [ ] `pnpm lint` → exit 0, zero diagnostics
- [ ] `pnpm exec tsc --noEmit` → exit 0
- [ ] `pnpm test` → all passing
- [ ] `pnpm build` → exit 0
- [ ] `pnpm knip` → no tailwindcss warnings
- [ ] `grep -r "biome-ignore" src/ | wc -l` ≤ 5 (apenas fronteiras Recharts + testes)
- [ ] `biome.json` sem `"off"` globais nas 4 regras críticas

### Must Have
- Overrides com escopo RESTRITO (por arquivo/pattern), NUNCA global off
- Cada wave = 1 commit atômico e reversível
- Nenhum novo supress comment adicionado sem documentação

### Must NOT Have (Guardrails)
- NÃO usar `cdn.cheapshark.com` — hostname correto é `img.cheapshark.com`
- NÃO mudar ordem do CI (lint→build já está correta)
- NÃO criar tipos completos da API CheapShark — apenas campos usados
- NÃO refatorar CSS além de mover `@theme`
- NÃO modificar `hltb.test.ts` — `.forEach` em testes é idiomático
- NÃO remover supressões de Recharts formatters — lib exige `any`
- NÃO mexer em `src/utils/pricing.ts` (fora do escopo)
- NÃO alterar `vercel.json` removido — não é necessário

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest + playwright)
- **Automated tests**: Tests-after (verificar que mudanças não quebram testes existentes)
- **Framework**: vitest (unit) + playwright (e2e)

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

- **CLI**: Bash — `biome check`, `tsc --noEmit`, `vitest run`, `pnpm build`, `pnpm knip`
- **API**: Bash (curl) — verificar endpoints após build
- **Frontend**: Playwright — screenshot comparativo antes/depois para mudanças de `<Image>`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (INVESTIGAÇÃO + ESTABILIZAÇÃO — 4 tasks, todas paralelas):
├── T1: Contar violações reais de cada regra [quick]
├── T2: knip.json → ignoreDependencies [quick]
├── T3: biome.json → overrides para dangerouslySetInnerHtml (JSON-LD) [quick]
└── T4: biome.json → overrides para noArrayIndexKey, useSemanticElements, noNonNullAssertion [quick]

Wave 2 (TIPOS — 4 tasks, 3 paralelas):
├── T5: CheapShark API types → unknown + narrowing [deep]
├── T6: Supabase types → User do @supabase/supabase-js [quick]
├── T7: Component props → substituir any inline [quick]
└── T8: Recharts formatters → manter any com override documentado [quick]

Wave 3 (IMAGENS — 4 tasks, 2 paralelas):
├── T9: next.config.ts → remotePatterns para store favicons [quick]
├── T10: <img> → <Image> optimized (bundles, collections, game thumbs) [visual-engineering]
├── T11: <img> → <Image> unoptimized (store logos, avatars, hero bg) [visual-engineering]
└── T12: Playwright screenshot diff → confirmar sem regressão visual [visual-engineering]

Wave 4 (FOREACH — 3 tasks, 2 paralelas):
├── T13: src/services/api.ts → for..of [quick]
├── T14: src/actions/ + src/utils/ → for..of [quick]
└── T15: Remover supressões useIterableCallbackReturn [quick]

Wave 5 (CSS — 2 tasks, sequenciais):
├── T16: Extrair @theme → tokens.css + import [quick]
└── T17: Remover globals.css do .gitignore [quick]

Wave 6 (PROCESSO — 3 tasks, paralelas):
├── T18: knip.json → revisão completa de ignoreDependencies [quick]
├── T19: GitHub issues de tracking (dívida restante) [writing]
└── T20: Verificação de rotação da chave service_role [quick]

Wave 7 (TESTES — 4 tasks, 3 paralelas):
├── T21: Teste unitário biome.json overrides [quick]
├── T22: Teste unitário type guards [quick]
├── T23: Playwright E2E — home page smoke test [visual-engineering]
└── T24: Teste de integração — lint coverage [unspecified-high]

Wave FINAL (VERIFICAÇÃO — 4 tasks, paralelas):
├── F1: Full lint check — biome + tsc [quick]
├── F2: Full test run — vitest + playwright [unspecified-high]
├── F3: Full build check — pnpm build + knip [quick]
└── F4: Playwright visual regression (home, game, search, bundles) [visual-engineering]
```

**Critical Path**: T1 → T3/T4 → T5 → T9 → T10/T11 → T12 → T16 → F1-F4
**Parallel Speedup**: ~60% faster than sequential
**Max Concurrent**: 4 (Wave 1, Wave FINAL)

---

## TODOs

### Wave 1: INVESTIGAÇÃO + ESTABILIZAÇÃO

- [x] 1. Contar violações reais de cada regra desabilitada

  **What to do**:
  - Re-ativar temporariamente cada regra `"off"` no biome.json (uma por vez)
  - Rodar `pnpm lint 2>&1 | grep -c <rule-name>` para cada regra
  - Anotar contagem exata de violações por regra:
    - `noArrayIndexKey`: quantas?
    - `noDangerouslySetInnerHtml`: quantas?
    - `useSemanticElements`: quantas?
    - `noNonNullAssertion`: quantas?
  - Salvar resultado em `.sisyphus/evidence/task-1-counts.txt`
  - **NÃO commitar** — apenas investigar, restaurar `"off"` depois
  - Verificar hostname real das imagens: `grep -r "cheapshark\|steampowered\|steamcdn" src/ --include="*.tsx" --include="*.ts" -h | grep -oP 'https?://[^"'\'']+' | sort -u`

  **Must NOT do**:
  - NÃO commitar as regras re-ativadas (causaria CI fail)
  - NÃO modificar código ainda — só contar

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T2)
  - **Parallel Group**: Wave 1
  - **Blocks**: T3, T4
  - **Blocked By**: None

  **References**:
  - `biome.json:32-44` — regras atualmente desabilitadas (linhas exatas)

  **QA Scenarios**:

  ```
  Scenario: Count violations of each disabled rule
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. For each rule (noArrayIndexKey, noDangerouslySetInnerHtml, useSemanticElements, noNonNullAssertion):
         - Edit biome.json: change "off" to "error" for that single rule
         - Run: pnpm lint 2>&1 | grep -c "<rule-name>" || echo "0"
      3. Save all counts to .sisyphus/evidence/task-1-counts.txt
      4. Restore biome.json: change back to "off"
    Expected Result: Four non-negative integers saved to file
    Evidence: .sisyphus/evidence/task-1-counts.txt

  Scenario: Discover actual image hostnames
    Tool: Bash
    Steps:
      1. grep -rPoh 'https?://[^"'\'' ]+\.(png|jpg|jpeg|webp|gif)' src/ | sort -u
      2. Extract unique hostnames from results
    Expected Result: List of image CDN hostnames actually used in code
    Evidence: .sisyphus/evidence/task-1-hostnames.txt
  ```

- [x] 2. Configurar knip.json — ignorar tailwindcss e dependências CSS

  **What to do**:
  - Verificar se `knip.json` ou `knip.ts` ou `.knip.json` já existe
  - Se NÃO existe: criar `knip.json` na raiz
  - Se JÁ existe: adicionar `ignoreDependencies`
  - Conteúdo a adicionar:
    ```json
    {
      "$schema": "https://unpkg.com/knip@5/schema.json",
      "ignoreDependencies": [
        "tailwindcss",
        "@tailwindcss/postcss"
      ]
    }
    ```
  - Rodar `pnpm knip` para verificar que tailwindcss NÃO aparece mais como unused
  - Verificar se outras dependências CSS/PostCSS também precisam ser ignoradas

  **Must NOT do**:
  - NÃO remover tailwindcss do package.json
  - NÃO alterar outras configs do knip sem necessidade

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1)
  - **Parallel Group**: Wave 1
  - **Blocks**: None diretamente (habilita Vercel)
  - **Blocked By**: None

  **References**:
  - `package.json:58` — tailwindcss em devDependencies
  - `package.json:49` — @tailwindcss/postcss em devDependencies

  **QA Scenarios**:

  ```
  Scenario: knip no longer reports tailwindcss as unused
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. Run: pnpm knip 2>&1
      3. Check output does NOT contain "tailwindcss" in unused dependencies section
    Expected Result: No mention of tailwindcss in knip output
    Failure Indicators: "tailwindcss" appears in unused dependencies
    Evidence: .sisyphus/evidence/task-2-knip.txt
  ```

- [x] 3. biome.json — overrides para JSON-LD (dangerouslySetInnerHtml)

  **What to do**:
  - Identificar os 2 arquivos que usam `dangerouslySetInnerHTML` para JSON-LD:
    - `src/app/layout.tsx` (linha ~108)
    - `src/app/game/[id]/page.tsx` (linha ~170)
  - Adicionar override no biome.json que permite `noDangerouslySetInnerHtml` APENAS nesses 2 arquivos
  - Remover `"security": { "noDangerouslySetInnerHtml": "off" }` da seção global `linter.rules`
  - Override syntax:
    ```json
    "overrides": [
      {
        "includes": ["src/app/layout.tsx", "src/app/game/[id]/page.tsx"],
        "linter": {
          "rules": {
            "security": {
              "noDangerouslySetInnerHtml": "off"
            }
          }
        }
      }
    ]
    ```
  - Rodar `pnpm lint` — deve passar sem erros nesses arquivos

  **Must NOT do**:
  - NÃO desabilitar a regra globalmente (remover o `"off"` global)
  - NÃO adicionar override com escopo mais amplo que os 2 arquivos

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T4, after T1)
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: T1 (precisa saber contagem de violações)

  **References**:
  - `biome.json:39-41` — regra `noDangerouslySetInnerHtml: "off"` atual
  - `src/app/layout.tsx:108` — JSON-LD com dangerouslySetInnerHTML
  - `src/app/game/[id]/page.tsx:170` — JSON-LD com dangerouslySetInnerHTML
  - Biome docs: `overrides[].includes` com glob patterns, `linter.rules` dentro do override

  **QA Scenarios**:

  ```
  Scenario: biome check passes with override, fails if override removed
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. Run: pnpm lint
      3. Check exit code = 0
      4. Check no lint errors in layout.tsx or game/[id]/page.tsx
    Expected Result: Exit 0, zero diagnostics
    Failure Indicators: Exit code != 0, errors mentioning noDangerouslySetInnerHtml
    Evidence: .sisyphus/evidence/task-3-lint.txt
  ```

- [x] 4. biome.json — overrides para regras restantes + remover "off" globais

  **What to do**:
  - Basear-se nos counts do T1 para decidir escopo de cada override
  - `noArrayIndexKey`: se ≤5 violações, consertar código (adicionar key estável). Se >5, override por diretório
  - `useSemanticElements`: override para componentes específicos com checkbox/role customizado
  - `noNonNullAssertion`: override para arquivos específicos, NÃO global
  - Remover TODAS as 4 regras `"off"` da seção `linter.rules` global
  - Garantir que `pnpm lint` passa com exit 0

  **Padrão de override por arquivo** (mais restrito):
  ```json
  {
    "overrides": [
      {
        "includes": ["src/components/SpecificComponent.tsx"],
        "linter": {
          "rules": {
            "a11y": { "useSemanticElements": "off" }
          }
        }
      }
    ]
  }
  ```

  **Padrão de override por diretório** (se muitas violações):
  ```json
  {
    "overrides": [
      {
        "includes": ["src/components/**/*.tsx"],
        "linter": {
          "rules": {
            "a11y": { "useSemanticElements": "off" }
          }
        }
      }
    ]
  }
  ```

  **Must NOT do**:
  - NÃO usar escopo mais amplo que o necessário
  - NÃO deixar nenhuma regra `"off"` global
  - NÃO quebrar CI — verificar com `pnpm lint` antes de commitar

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T3, after T1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Wave 2+ (todas as ondas seguintes dependem do biome.json estável)
  - **Blocked By**: T1 (precisa dos counts)

  **References**:
  - `biome.json:32-44` — 4 regras atualmente `"off"`
  - `.sisyphus/evidence/task-1-counts.txt` — resultado da investigação
  - Biome docs: `overrides` array, `includes` com glob, ordem first-match-wins

  **QA Scenarios**:

  ```
  Scenario: biome check zero diagnostics after overrides applied
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. Run: pnpm lint
      3. Assert exit code = 0
      4. Assert output has zero diagnostic lines (empty or "Checked N files in Xms. No problems found.")
    Expected Result: "No problems found" or empty diagnostics
    Failure Indicators: Any diagnostic line in output
    Evidence: .sisyphus/evidence/task-4-lint.txt

  Scenario: biome.json has zero global "off" rules for the 4 target rules
    Tool: Bash
    Steps:
      1. cat biome.json | python3 -c "import json,sys; d=json.load(sys.stdin); rules=d['linter']['rules']; print('noArrayIndexKey' in rules.get('suspicious',{})); print('noDangerouslySetInnerHtml' in rules.get('security',{})); print('useSemanticElements' in rules.get('a11y',{})); print('noNonNullAssertion' in rules.get('style',{}))"
      2. All four lines should print "False"
    Expected Result: False, False, False, False
    Evidence: .sisyphus/evidence/task-4-global-off.txt
  ```

### Wave 2: TIPOS (any → tipos reais)

- [x] 5. Tipar CheapShark API responses — `unknown` + narrowing

  **What to do**:
  - Arquivos afetados: `src/actions/deals.ts` (6 supressões), `src/services/api.ts` (2 supressões)
  - Estratégia: substituir `any` por `unknown` nos parâmetros de função que recebem dados da CheapShark API
  - Adicionar type guards inline (narrowing) para validar campos antes de usar
  - Exemplo de transformação:
    ```typescript
    // ANTES
    // biome-ignore lint/suspicious/noExplicitAny: CheapShark API response
    function processDeal(deal: any) {
      return deal.title + ' - $' + deal.salePrice;
    }

    // DEPOIS
    function processDeal(deal: unknown) {
      if (
        typeof deal === 'object' &&
        deal !== null &&
        'title' in deal &&
        'salePrice' in deal
      ) {
        const d = deal as { title: string; salePrice: string };
        return d.title + ' - $' + d.salePrice;
      }
      return 'Unknown Deal';
    }
    ```
  - Para arrays de deals: `Array.isArray(data) && data.every(d => typeof d === 'object' && d !== null)`
  - Remover `// biome-ignore lint/suspicious/noExplicitAny` de cada arquivo após tipar

  **Must NOT do**:
  - NÃO criar interface completa da API CheapShark (só campos usados)
  - NÃO adicionar validação Zod (fora do escopo)
  - NÃO tipar campos que o código não acessa

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6, T7)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T3, T4 (biome.json estável)

  **References**:
  - `src/actions/deals.ts` — 6 supressões noExplicitAny
  - `src/services/api.ts` — 2 supressões noExplicitAny
  - `src/services/api.ts:50-95` — funções getDeals, getGame (exemplos de respostas CheapShark)

  **QA Scenarios**:

  ```
  Scenario: TypeScript compiles without errors after any removal
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. Run: pnpm exec tsc --noEmit
      3. Assert exit code = 0
    Expected Result: Exit 0, zero type errors
    Failure Indicators: Exit code != 0, type errors in deals.ts or api.ts
    Evidence: .sisyphus/evidence/task-5-tsc.txt

  Scenario: Biome no longer reports noExplicitAny in fixed files
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. Run: pnpm lint 2>&1 | grep "noExplicitAny" | grep -E "deals\.ts|api\.ts" || echo "CLEAN"
    Expected Result: "CLEAN" (no matches)
    Evidence: .sisyphus/evidence/task-5-lint.txt
  ```

- [x] 6. Tipar serverUser no Navbar — usar tipo User do Supabase

  **What to do**:
  - Arquivo: `src/components/Navbar.tsx` (1 supressão noExplicitAny na linha ~175)
  - Substituir `serverUser as any` ou `(serverUser: any)` pelo tipo correto
  - Importar tipo `User` do `@supabase/supabase-js`:
    ```typescript
    import type { User } from '@supabase/supabase-js';
    ```
  - Tipar a prop ou variável com `User | null`
  - Acessar campos tipados: `user.user_metadata?.avatar_url`, `user.email`, etc.
  - Remover `// biome-ignore lint/suspicious/noExplicitAny`

  **Must NOT do**:
  - NÃO mudar a lógica de autenticação
  - NÃO alterar como o Supabase client é inicializado

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5, T7)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T3, T4 (biome.json estável)

  **References**:
  - `src/components/Navbar.tsx:175` — servidorUser com any
  - `src/utils/supabase/server.ts` — server client (ver imports)
  - `@supabase/supabase-js` — User type export

  **QA Scenarios**:

  ```
  Scenario: Navbar still renders user info correctly
    Tool: Bash (tsc) + Playwright
    Steps:
      1. pnpm exec tsc --noEmit → exit 0
      2. pnpm lint 2>&1 | grep "Navbar" | grep "noExplicitAny" || echo "CLEAN"
    Expected Result: tsc passes, no noExplicitAny in Navbar
    Evidence: .sisyphus/evidence/task-6-check.txt
  ```

- [x] 7. Tipar props de componentes — any → tipos inline

  **What to do**:
  - Arquivos afetados:
    - `src/components/Charts.tsx` (2 supressões)
    - `src/components/SyncManager.tsx` (2 supressões)
    - `src/components/DynamicCharts.tsx` (1 supressão)
    - `src/actions/search.ts` (2 supressões)
    - `src/actions/alerts.ts` (1 supressão)
    - `src/app/wishlist/shared/page.tsx` (1 supressão)
    - `src/app/collections/[slug]/page.tsx` (2 supressões)
  - Para cada arquivo:
    - Identificar o parâmetro `any`
    - Criar tipo inline ou interface simples com os campos usados
    - Remover `// biome-ignore lint/suspicious/noExplicitAny`

  **Must NOT do**:
  - NÃO criar arquivos de tipos separados (tipos inline são OK para este escopo)
  - NÃO modificar lógica de negócio — só adicionar tipos

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5, T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: T3, T4 (biome.json estável)

  **References**:
  - `src/components/Charts.tsx:30-60` — where any is used
  - `src/components/SyncManager.tsx:20-40` — where any is used
  - `src/actions/search.ts:40-60` — where any is used

  **QA Scenarios**:

  ```
  Scenario: All 7 files pass tsc and biome after typing
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. pnpm exec tsc --noEmit → assert exit 0
      3. pnpm lint 2>&1 | grep "noExplicitAny" | grep -v "Recharts\|formatter" || echo "CLEAN"
    Expected Result: Exit 0 for both, no noExplicitAny outside Recharts
    Evidence: .sisyphus/evidence/task-7-check.txt
  ```

- [x] 8. Documentar exceções Recharts — manter any com override

  **What to do**:
  - Identificar todos os Recharts formatters que exigem `any` (a API do Recharts usa `(value: any, name: any, ...)`)
  - Verificar cada ocorrência: se o tipo pode ser restringido (ex: `value: number | string`), restringir. Se não (Recharts exige assinatura exata), manter `any` com supressão documentada
  - Adicionar comentário explicando POR QUE o any é necessário:
    ```typescript
    // Recharts formatter API requires (value: any, name: any) signature
    // biome-ignore lint/suspicious/noExplicitAny: Recharts type constraint
    const formatTooltip = (value: any, name: any) => { ... };
    ```
  - Alternativa: criar wrapper tipado que chama o formatter Recharts:
    ```typescript
    const formatTooltip = (value: number, name: string): [string, string] => { ... };
    // Then use: <Tooltip formatter={formatTooltip as any} />
    ```
    (O cast `as any` fica na fronteira, localizado, documentado)

  **Must NOT do**:
  - NÃO remover supressões sem alternativa (Recharts quebraria)
  - NÃO criar wrapper complexo — simplicidade acima de pureza

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após T5-T7)
  - **Parallel Group**: Wave 2 (final)
  - **Blocks**: None
  - **Blocked By**: T5, T6, T7 (precisa saber quais any sobraram)

  **References**:
  - `src/components/Charts.tsx` — Recharts Tooltip formatter
  - `src/components/DynamicCharts.tsx` — Recharts components

  **QA Scenarios**:

  ```
  Scenario: Remaining biome-ignore are only Recharts frontiers
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. pnpm lint 2>&1 | grep "noExplicitAny"
      3. Verify ALL occurrences mention "Recharts" in the suppression comment
    Expected Result: Zero or only Recharts-related noExplicitAny
    Evidence: .sisyphus/evidence/task-8-recharts.txt
  ```

### Wave 3: IMAGENS (`<img>` → `<Image>`)

- [x] 9. next.config.ts — remotePatterns para store favicons e CheapShark

  **What to do**:
  - Verificar remotePatterns atual em `next.config.ts`
  - Já deve ter `img.cheapshark.com` e `steamcdn-a.akamaihd.net` e `cdn.cloudflare.steamstatic.com`
  - Adicionar hostnames para store favicons usados em `src/constants/stores.ts`:
    - `store.steampowered.com`, `www.gog.com`, `www.humblebundle.com`, `www.fanatical.com`, `www.greenmangaming.com`, `store.epicgames.com`, `www.microsoft.com`
  - Para grey market stores (cdkeys, kinguin, eneba, gamivo) — usar wildcard `**` ou adicionar domínios específicos
  - **Hostname a NÃO adicionar**: `cdn.cheapshark.com` (não existe, o correto é `img.cheapshark.com`)

  **Must NOT do**:
  - NÃO adicionar `cdn.cheapshark.com` (hostname errado)
  - NÃO usar `domains` (deprecated no Next.js 14+, usar `remotePatterns`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (precede T10/T11)
  - **Parallel Group**: Wave 3
  - **Blocks**: T10, T11
  - **Blocked By**: T3, T4 (biome.json estável)

  **References**:
  - `next.config.ts` — remotePatterns atual
  - `src/constants/stores.ts:1-30` — STORE_FAVICON_MAP com todas as URLs
  - Next.js docs: `images.remotePatterns` array com `{ protocol, hostname, pathname }`

  **QA Scenarios**:

  ```
  Scenario: Build succeeds with new remotePatterns
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. pnpm build 2>&1
      3. Assert exit code = 0
      4. Assert no "hostname not configured" errors in output
    Expected Result: Build passes, no image hostname errors
    Evidence: .sisyphus/evidence/task-9-build.txt
  ```

- [x] 10. `<img>` → `<Image>` optimized — bundles, collections, game thumbs

  **What to do**:
  - Arquivos com imagens de hostnames JÁ em remotePatterns (Steam CDN, CheapShark):
    - `src/components/DealRow.tsx` — miniatura do jogo (CheapShark thumb)
    - `src/components/HeroSection.tsx` — background (pode ser unoptimized, decorativo)
    - `src/app/bundles/page.tsx` — miniaturas de bundle
    - `src/app/game/[id]/page.tsx` — miniatura do jogo
    - `src/app/collections/[slug]/page.tsx` — miniaturas de coleção
    - `src/app/@modal/(.)game/[id]/page.tsx` — miniatura no modal
  - Para CADA `<img>`:
    ```tsx
    // ANTES
    // biome-ignore lint/performance/noImgElement: reason
    <img src={deal.thumb} alt={deal.title} className="w-full h-48 object-cover" />

    // DEPOIS
    import Image from 'next/image';

    <Image
      src={deal.thumb}
      alt={deal.title}
      width={400}
      height={200}
      className="w-full h-48 object-cover"
      unoptimized={isExternalUrl(deal.thumb)}
    />
    ```
  - Remover `// biome-ignore lint/performance/noImgElement` após migrar
  - Usar dimensões proporcionais (ex: thumb CheapShark é ~480x270, usar width={480} height={270})

  **Must NOT do**:
  - NÃO usar `fill` sem container com position:relative
  - NÃO esquecer `alt` (obrigatório no `<Image>`)
  - NÃO remover classes CSS úteis (object-cover, etc.)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T11, after T9)
  - **Parallel Group**: Wave 3
  - **Blocks**: T12 (screenshot diff)
  - **Blocked By**: T9 (remotePatterns)

  **References**:
  - `src/components/DealRow.tsx` — <img> com thumb
  - `src/app/bundles/page.tsx` — 2 <img> tags
  - `src/app/game/[id]/page.tsx` — 1 <img> tag
  - `src/app/collections/[slug]/page.tsx` — 1 <img> tag
  - `src/app/@modal/(.)game/[id]/page.tsx` — 1 <img> tag
  - Next.js docs: `next/image` API reference, `unoptimized` prop

  **QA Scenarios**:

  ```
  Scenario: Images render correctly after migration (happy path)
    Tool: Bash (build) + Playwright (visual)
    Steps:
      1. pnpm build → assert exit 0
      2. pnpm dev (background)
      3. Playwright: navigate to /, /game/146, /bundles, /collections/trending
      4. Screenshot each page
      5. Compare with reference screenshots (if available)
    Expected Result: Build passes, images visible on all pages
    Evidence: .sisyphus/evidence/task-10-screenshots/

  Scenario: Biome no longer reports noImgElement in migrated files
    Tool: Bash
    Steps:
      1. pnpm lint 2>&1 | grep "noImgElement" | grep -E "DealRow|bundles|game|collections|modal" || echo "CLEAN"
    Expected Result: "CLEAN"
    Evidence: .sisyphus/evidence/task-10-lint.txt
  ```

- [x] 11. `<img>` → `<Image>` unoptimized — store logos, avatars, hero bg

  **What to do**:
  - Arquivos com imagens de CDNs arbitrários (não em remotePatterns ou dinâmicos):
    - `src/components/Navbar.tsx` — logo do site, avatar do usuário
    - `src/components/HeroSection.tsx` — background matrix (decorativo, alt="")
    - Qualquer `<img>` de store favicon (20+ domínios diferentes)
  - Para CADA caso, usar `unoptimized` quando:
    - URL é dinâmica (avatar de Google/GitHub/Discord)
    - Hostname não está em remotePatterns (store favicons)
    - Imagem é puramente decorativa (background matrix)
  ```tsx
  import Image from 'next/image';

  // Store favicon — unoptimized (external CDN)
  <Image
    src={faviconUrl}
    alt=""
    width={24}
    height={24}
    unoptimized
    className="inline-block"
  />

  // User avatar — unoptimized (arbitrary URL)
  <Image
    src={userAvatar}
    alt={userName}
    width={32}
    height={32}
    unoptimized
    className="rounded-full"
  />
  ```
  - Remover `// biome-ignore lint/performance/noImgElement`
  - `alt=""` para imagens decorativas (válido, Next.js aceita)

  **Must NOT do**:
  - NÃO adicionar 20+ hostnames ao remotePatterns (explode config)
  - NÃO otimizar imagens de CDNs externos (não temos controle)
  - NÃO usar `unoptimized` para imagens que PODEM ser otimizadas (Steam CDN)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, after T9)
  - **Parallel Group**: Wave 3
  - **Blocks**: T12 (screenshot diff)
  - **Blocked By**: T9 (remotePatterns)

  **References**:
  - `src/components/Navbar.tsx:40-60` — logo + avatar <img> tags
  - `src/components/HeroSection.tsx:30-45` — background matrix <img>
  - `src/constants/stores.ts` — STORE_FAVICON_MAP
  - Next.js docs: `unoptimized` prop (skips srcset generation, keeps original)

  **QA Scenarios**:

  ```
  Scenario: Store logos and avatars still visible with unoptimized
    Tool: Playwright
    Steps:
      1. pnpm dev (background)
      2. Navigate to /
      3. Check Navbar: logo visible, user avatar (if logged in) visible
      4. Screenshot store logos section
    Expected Result: All images render without broken src
    Evidence: .sisyphus/evidence/task-11-screenshots/

  Scenario: No noImgElement supressions remain in Navbar or HeroSection
    Tool: Bash
    Steps:
      1. pnpm lint 2>&1 | grep "noImgElement" | grep -E "Navbar|HeroSection" || echo "CLEAN"
    Expected Result: "CLEAN"
    Evidence: .sisyphus/evidence/task-11-lint.txt
  ```

- [ ] 12. Playwright screenshot diff — confirmar sem regressão visual

  **What to do**:
  - Tirar screenshots das páginas principais (home, /game/146, /bundles, /search?q=action)
  - Comparar visualmente: imagens no lugar certo? Tamanhos proporcionais? Sem layout shift?
  - Verificar console do navegador: sem erros de "hostname not configured"
  - Verificar network: imagens carregando (status 200, não 400/404)

  **Must NOT do**:
  - NÃO commitar screenshots de referência no repo
  - NÃO usar pixel-diff (mudanças esperadas de otimização Next.js)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`webapp-testing`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após T10+T11)
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None
  - **Blocked By**: T10, T11

  **References**:
  - Todas as páginas modificadas em T10 e T11

  **QA Scenarios**:

  ```
  Scenario: Visual regression check — 4 pages
    Tool: Playwright
    Preconditions: pnpm dev running on :3000
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for all images to load (networkidle)
      3. Screenshot: .sisyphus/evidence/task-12-home.png
      4. Navigate to http://localhost:3000/game/146
      5. Wait networkidle → screenshot: .sisyphus/evidence/task-12-game.png
      6. Navigate to http://localhost:3000/bundles
      7. Wait networkidle → screenshot: .sisyphus/evidence/task-12-bundles.png
      8. Navigate to http://localhost:3000/collections/trending
      9. Wait networkidle → screenshot: .sisyphus/evidence/task-12-collections.png
      10. Check console: no errors containing "Image" or "hostname"
    Expected Result: All screenshots show correctly rendered images
    Failure Indicators: Broken image icons, console errors about hostnames, 400/404 in network
    Evidence: .sisyphus/evidence/task-12-*.png
  ```

### Wave 4: FOREACH (`.forEach()` side-effects → `for..of`)

- [x] 13. src/services/api.ts — forEach → for..of

  **What to do**:
  - Arquivo: `src/services/api.ts` (2 supressões useIterableCallbackReturn)
  - Identificar os 2 usos de `.forEach()` com callbacks que não retornam nada (side effects)
  - Converter para `for..of`:
    ```typescript
    // ANTES
    // biome-ignore lint/suspicious/useIterableCallbackReturn: side-effect only
    deals.forEach((deal) => {
      results.push(normalizeDeal(deal));
    });

    // DEPOIS
    for (const deal of deals) {
      results.push(normalizeDeal(deal));
    }
    ```
  - Remover `// biome-ignore lint/suspicious/useIterableCallbackReturn`
  - Verificar que a lógica de negócio não mudou (push, mutations, etc.)

  **Must NOT do**:
  - NÃO converter `.forEach()` que usa `thisArg` (não ocorre aqui)
  - NÃO mudar semântica de `break/continue` — `for..of` com `break` é mais poderoso

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T14)
  - **Parallel Group**: Wave 4
  - **Blocks**: T15
  - **Blocked By**: T3, T4

  **References**:
  - `src/services/api.ts` — forEach loops com supress

  **QA Scenarios**:

  ```
  Scenario: api.ts no longer has useIterableCallbackReturn supressions
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. pnpm lint 2>&1 | grep "api.ts" | grep "useIterableCallbackReturn" || echo "CLEAN"
      3. pnpm test → assert exit 0
    Expected Result: "CLEAN", tests pass
    Evidence: .sisyphus/evidence/task-13-check.txt
  ```

- [x] 14. src/utils/ + src/actions/ — forEach → for..of

  **What to do**:
  - Arquivos afetados:
    - `src/actions/deals.ts` (1 supressão)
    - `src/utils/supabase/middleware.ts` (2 supressões)
    - `src/utils/supabase/server.ts` (1 supressão)
  - Para cada arquivo:
    - Identificar `.forEach()` com callback de side-effect
    - Converter para `for..of`
    - Remover supress comment correspondente

  **Must NOT do**:
  - NÃO converter `.forEach()` que itera sobre respostas de API (ex: `response.data.forEach`)
  - NÃO criar arrays intermediários desnecessários com `.map()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T13)
  - **Parallel Group**: Wave 4
  - **Blocks**: T15
  - **Blocked By**: T3, T4

  **References**:
  - `src/actions/deals.ts` — forEach supress
  - `src/utils/supabase/middleware.ts` — middleware with 2 forEach
  - `src/utils/supabase/server.ts` — server client with 1 forEach

  **QA Scenarios**:

  ```
  Scenario: All 4 files cleaned of forEach supressions
    Tool: Bash
    Steps:
      1. pnpm lint 2>&1 | grep "useIterableCallbackReturn" || echo "CLEAN"
      2. pnpm test → exit 0
    Expected Result: "CLEAN", no useIterableCallbackReturn remains
    Evidence: .sisyphus/evidence/task-14-check.txt
  ```

- [x] 15. Remover supressões useIterableCallbackReturn restantes

  **What to do**:
  - Após T13 + T14, verificar se alguma supressão de `useIterableCallbackReturn` sobrou
  - Rodar: `grep -r "useIterableCallbackReturn" src/`
  - Se sobrou em `hltb.test.ts`: manter com comentário explicando que `.forEach` em testes é idiomático:
    ```typescript
    // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach in tests is idiomatic
    ```
  - Se sobrou em qualquer outro arquivo: converter para `for..of`

  **Must NOT do**:
  - NÃO modificar `hltb.test.ts` — `.forEach()` com expect assertions é padrão aceito em testes
  - NÃO remover supressão de teste sem converter (causaria CI fail)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após T13+T14)
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: T13, T14

  **References**:
  - `.sisyphus/evidence/task-14-check.txt`
  - `src/services/hltb.test.ts` — if forEach supress exists

  **QA Scenarios**:

  ```
  Scenario: Only test files have the supression
    Tool: Bash
    Steps:
      1. grep -rn "useIterableCallbackReturn" src/ | grep -v "\.test\." || echo "ONLY_TESTS"
    Expected Result: "ONLY_TESTS" or zero matches
    Evidence: .sisyphus/evidence/task-15-check.txt
  ```

---

### Wave 5: CSS (globals.css de volta ao lint)

- [x] 16. Extrair `@theme` para tokens.css

  **What to do**:
  - Criar `src/app/tokens.css` com o bloco `@theme` atual de `globals.css:3-22`
    ```css
    /* ─── GameDeals Design Tokens ─── */
    @theme {
      /* Core Colors */
      --color-bg-dark: hsl(228 15% 13%);
      --color-bg-card: hsl(226 14% 18%);
      --color-bg-muted: hsl(226 14% 24%);
      --color-text-primary: hsl(0 0% 98%);
      --color-text-muted: hsl(226 10% 65%);
      --color-border: hsl(226 14% 28%);
      /* Accent */
      --color-primary: hsl(150 100% 42%);
      --color-primary-foreground: hsl(150 100% 10%);
      --color-accent-hl: hsl(150 88% 27%);
      --color-accent-hl-foreground: hsl(150 100% 85%);
      --color-accent-fire: hsl(22 100% 59%);
      /* Typography */
      --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
    }
    ```
  - Em `globals.css`, remover o bloco `@theme` e adicionar import:
    ```css
    @import "./tokens.css";
    @import "tailwindcss";
    ```
  - Verificar que `globals.css` continua parseável pelo Biome (sem `@theme`)

  **Must NOT do**:
  - NÃO mover outros blocos CSS (só `@theme`)
  - NÃO mudar imports do Tailwind (`@import "tailwindcss"` permanece)
  - NÃO adicionar tokens.css ao `.gitignore`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial — T16 before T17)
  - **Parallel Group**: Wave 5
  - **Blocks**: T17
  - **Blocked By**: None

  **References**:
  - `src/app/globals.css:3-22` — @theme block to extract
  - Tailwind v4 docs: `@import` of custom files

  **QA Scenarios**:

  ```
  Scenario: globals.css parses without @theme
    Tool: Bash
    Steps:
      1. cd /home/emiyakiritsugu/Projetos_Antigravity/game-deals
      2. npx biome check src/app/globals.css 2>&1
      3. Assert no parse error about @theme or unknown at-rule
    Expected Result: Clean check, no parse errors
    Evidence: .sisyphus/evidence/task-16-css-lint.txt

  Scenario: Build succeeds with tokens.css
    Tool: Bash
    Steps:
      1. pnpm build 2>&1
      2. Assert exit code = 0
      3. Assert no Tailwind/CSS errors
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-16-build.txt
  ```

- [x] 17. Remover globals.css do .gitignore

  **What to do**:
  - Remover linha `src/app/globals.css` do `.gitignore` (linha ~49-50)
  - **IMPORTANTE**: `globals.css` está TRACKED pelo git (commitado antes do .gitignore)
    - `.gitignore` só AFETA o Biome (vcs.useIgnoreFile: true)
    - Git IGNORA .gitignore para arquivos já tracked
  - Após remover do `.gitignore`, rodar `npx biome check src/app/globals.css` para confirmar sem erros
  - Se ainda falhar: verificar se `@import "tailwindcss"` é parseável pelo Biome

  **Must NOT do**:
  - NÃO remover outras entradas do .gitignore
  - NÃO usar `git rm --cached` (arquivo deve continuar tracked)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após T16)
  - **Parallel Group**: Wave 5
  - **Blocks**: None
  - **Blocked By**: T16

  **References**:
  - `.gitignore:49` — `src/app/globals.css`
  - `src/app/globals.css` — agora sem @theme

  **QA Scenarios**:

  ```
  Scenario: globals.css is checked by Biome from .gitignore removal
    Tool: Bash
    Steps:
      1. grep "globals.css" .gitignore || echo "REMOVED"
      2. npx biome check src/app/globals.css 2>&1
      3. Assert no parse errors, exit 0
    Expected Result: .gitignore has no globals.css entry, biome check passes
    Evidence: .sisyphus/evidence/task-17-gitignore.txt

  Scenario: git still tracks globals.css
    Tool: Bash
    Steps:
      1. git ls-files src/app/globals.css
      2. Assert output is non-empty (file is tracked)
    Expected Result: File path shown (tracked)
    Evidence: .sisyphus/evidence/task-17-tracked.txt
  ```

---

### Wave 6: PROCESSO (blindagem contra recorrência)

- [ ] 18. knip.json — revisão completa de ignoreDependencies

  **What to do**:
  - Verificar `package.json` para dependências que são usadas indiretamente:
    - `tailwindcss` — usado via CSS `@import`
    - `@tailwindcss/postcss` — usado via `postcss.config.mjs`
    - Outras dependências PostCSS, Babel, ESLint
  - Adicionar TODAS ao `knip.json.ignoreDependencies`:
    ```json
    {
      "$schema": "https://unpkg.com/knip@5/schema.json",
      "ignoreDependencies": [
        "tailwindcss",
        "@tailwindcss/postcss"
      ]
    }
    ```
  - Rodar `pnpm knip` e verificar output limpo
  - Se knip reportar outras dependências não usadas mas que são indiretas, adicionar também

  **Must NOT do**:
  - NÃO ignorar dependências que realmente não são usadas (se knip reporta, é real — verificar cada uma)
  - NÃO adicionar `ignoreDependencies` sem verificar que a dep é realmente necessária

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T19)
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `package.json` — all devDependencies
  - `postcss.config.mjs` — PostCSS plugins

  **QA Scenarios**:

  ```
  Scenario: knip passes with zero warnings about ignored deps
    Tool: Bash
    Steps:
      1. pnpm knip 2>&1
      2. Assert no warnings about tailwindcss
      3. Assert exit code = 0
    Expected Result: Clean knip output
    Evidence: .sisyphus/evidence/task-18-knip.txt
  ```

- [ ] 19. GitHub issues de tracking para dívida restante

  **What to do**:
  - Criar issues no GitHub para cada item de dívida técnica que NÃO será resolvido nesta PR:
    - `tech-debt: remove unoptimized flag from store logos when remotePatterns expanded`
    - `tech-debt: add proper CheapShark API types from OpenAPI spec`
    - `tech-debt: PR size gate (max 15 files)`
  - Cada issue deve ter:
    - Labels: `tech-debt`, `quality`
    - Descrição clara do que precisa ser feito e por que não foi feito agora
    - Referência ao arquivo de plano (`.sisyphus/plans/pr10-quality-fix.md`)

  **Must NOT do**:
  - NÃO criar issues para coisas que já foram resolvidas
  - NÃO criar issues vagas (ex: "melhorar qualidade")

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T18)
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/constants/stores.ts` — STORE_FAVICON_MAP with 20+ CDNs
  - `src/services/api.ts` — CheapShark API calls
  - CLI.md — PR conventions

  **QA Scenarios**:

  ```
  Scenario: Issues created with correct labels
    Tool: GitHub API (gh)
    Steps:
      1. For each issue created, verify: gh issue view <number> --json labels,title
      2. Assert all have 'tech-debt' label
    Expected Result: Issues exist with correct labels
    Evidence: Issue URLs
  ```

- [ ] 20. Verificação de rotação da chave service_role

  **What to do**:
  - O relatório menciona "GitGuardian secret leak em seed_tester.js" tratado em sessão anterior
  - Verificar:
    1. `git log --all --oneline | grep -i "secret\|leak\|service_role\|rotate"` — commits relacionados
    2. `git log --all -p -- "**/seed_tester*"` — verificar se o arquivo foi removido
    3. `grep -r "service_role" . --include="*.ts" --include="*.js" --include="*.env*" 2>/dev/null` — verificar se chave ainda existe no código
    4. Verificar `.env.example` — se `SUPABASE_SERVICE_ROLE_KEY=your-secret-key` ainda está lá, é OK (é placeholder)
  - Se `service_role` não foi rotacionada (chave vazada != chave atual): **CRITICAL** — alertar imediatamente
  - Se foi rotacionada: documentar evidência

  **Must NOT do**:
  - NÃO comitar verificações que exponham a chave
  - NÃO assumir que "já foi tratado" sem verificar

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T18, T19)
  - **Parallel Group**: Wave 6
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - Relatório PR #10: "GitGuardian passou nos checks recentes"
  - `src/db/index.ts` — usa DATABASE_URL, NÃO service_role
  - `.env.example` — service_role placeholder

  **QA Scenarios**:

  ```
  Scenario: service_role key not exposed in any source file
    Tool: Bash
    Steps:
      1. grep -r "service_role" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "CLEAN"
      2. grep "service_role" .env.example 2>/dev/null
      3. Assert step 1 returns no matches or only env var names (not values)
      4. Assert step 2 shows only placeholder (if exists)
    Expected Result: No hardcoded service_role values in source
    Evidence: .sisyphus/evidence/task-20-key-check.txt
  ```

---

### Wave 7: TESTES (adicionar testes faltantes)

- [ ] 21. Adicionar teste unitário para overrides do biome.json

  **What to do**:
  - Criar `tests/biome-config.test.ts`
  - Testar que:
    1. `biome.json` não tem regras `"off"` globais para `noArrayIndexKey`, `noDangerouslySetInnerHtml`, `useSemanticElements`, `noNonNullAssertion`
    2. Overrides existem para JSON-LD (layout.tsx, game/[id]/page.tsx)
    3. Overrides restringem escopo corretamente
  ```typescript
  import { describe, it, expect } from 'vitest';
  import biomeConfig from '../biome.json' assert { type: 'json' };

  describe('biome.json quality gates', () => {
    it('should not have global off for critical rules', () => {
      const rules = biomeConfig.linter.rules;
      const globalOff = [
        rules?.suspicious?.noArrayIndexKey,
        rules?.security?.noDangerouslySetInnerHtml,
        rules?.a11y?.useSemanticElements,
        rules?.style?.noNonNullAssertion,
      ].filter(v => v === 'off');
      expect(globalOff).toHaveLength(0);
    });

    it('should have overrides for dangerouslySetInnerHtml', () => {
      const overrides = biomeConfig.overrides || [];
      const jsonLdOverride = overrides.find(o =>
        o.includes?.some((i: string) => i.includes('layout.tsx'))
      );
      expect(jsonLdOverride?.linter?.rules?.security?.noDangerouslySetInnerHtml).toBe('off');
    });
  });
  ```
  - Rodar: `npx vitest run tests/biome-config.test.ts`

  **Must NOT do**:
  - NÃO testar comportamento do Biome em si (só nossa config)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T22, T23)
  - **Parallel Group**: Wave 7
  - **Blocks**: None
  - **Blocked By**: Waves 1-6 (precisa biome.json final)

  **QA Scenarios**:

  ```
  Scenario: biome config tests pass
    Tool: Bash
    Steps:
      1. npx vitest run tests/biome-config.test.ts
    Expected Result: 2+ tests pass
    Evidence: .sisyphus/evidence/task-21-test.txt
  ```

- [ ] 22. Adicionar teste para tipos (após Wave 2)

  **What to do**:
  - Criar `tests/type-guards.test.ts`
  - Testar os type guards adicionados na Wave 2 para CheapShark API:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import { processDeal } from '../src/actions/deals';

    describe('CheapShark API type guards', () => {
      it('should handle valid deal object', () => {
        const deal = { title: 'Game X', salePrice: '9.99' };
        expect(processDeal(deal)).toBe('Game X - $9.99');
      });

      it('should handle null gracefully', () => {
        expect(processDeal(null)).toBe('Unknown Deal');
      });

      it('should handle missing fields gracefully', () => {
        expect(processDeal({})).toBe('Unknown Deal');
      });
    });
    ```

  **Must NOT do**:
  - NÃO adicionar testes para cada variação de tipo (só casos principais)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T21, T23)
  - **Parallel Group**: Wave 7
  - **Blocks**: None
  - **Blocked By**: Wave 2 (tipos definidos)

  **QA Scenarios**:

  ```
  Scenario: type guard tests pass
    Tool: Bash
    Steps:
      1. npx vitest run tests/type-guards.test.ts
    Expected Result: 3+ tests pass
    Evidence: .sisyphus/evidence/task-22-test.txt
  ```

- [ ] 23. Playwright E2E: verificar página home carrega sem crash

  **What to do**:
  - Criar `e2e/home-page.spec.ts`:
    ```typescript
    import { test, expect } from '@playwright/test';

    test.describe('Home page', () => {
      test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        expect(errors).toHaveLength(0);
      });

      test('should display deal cards', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const cards = page.locator('[data-testid="deal-card"]');
        await expect(cards.first()).toBeVisible();
      });
    });
    ```
  - Verificar se `data-testid="deal-card"` existe no componente DealRow — se não, adicionar
  - Rodar: `pnpm exec playwright test e2e/home-page.spec.ts`

  **Must NOT do**:
  - NÃO adicionar múltiplos E2E (só smoke test básico)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`webapp-testing`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T21, T22)
  - **Parallel Group**: Wave 7
  - **Blocks**: None
  - **Blocked By**: Waves 1-3 (imagens + biome estáveis)

  **QA Scenarios**:

  ```
  Scenario: E2E home page test passes
    Tool: Playwright (headless)
    Steps:
      1. pnpm dev (background)
      2. pnpm exec playwright test e2e/home-page.spec.ts
    Expected Result: 2 tests pass, no console errors
    Evidence: .sisyphus/evidence/task-23-e2e.txt
  ```

- [ ] 24. Adicionar teste de integração: verificar biome check coverage

  **What to do**:
  - Criar `tests/lint-coverage.test.ts`:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import { execSync } from 'node:child_process';

    describe('lint coverage', () => {
      it('should have zero biome diagnostics', () => {
        const result = execSync('pnpm lint 2>&1', { encoding: 'utf-8' });
        const hasWarnings = result.includes('warning');
        const hasErrors = result.includes('error');
        // Se tiver warnings/errors, logar output completo
        if (hasWarnings || hasErrors) {
          console.log(result);
        }
        expect(hasWarnings).toBe(false);
        expect(hasErrors).toBe(false);
      });

      it('should have ≤5 biome-ignore suppressions', () => {
        const result = execSync(
          `grep -rl "biome-ignore" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
          { encoding: 'utf-8' }
        );
        const fileCount = result.trim() ? result.trim().split('\n').length : 0;
        expect(fileCount).toBeLessThanOrEqual(5);
      });
    });
    ```

  **Must NOT do**:
  - NÃO executar `pnpm lint` dentro de vitest se demorar >30s (aqui é rápido)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequencial após outras tasks)
  - **Parallel Group**: Wave 7 (final)
  - **Blocks**: None
  - **Blocked By**: Todas as Waves 1-6 passarem

  **QA Scenarios**:

  ```
  Scenario: Integration tests pass
    Tool: Bash
    Steps:
      1. npx vitest run tests/lint-coverage.test.ts
    Expected Result: Both tests pass
    Evidence: .sisyphus/evidence/task-24-integration.txt
  ```

---

## Final Verification Wave

- [ ] F1. Full lint check — biome + tsc

  **What to do**:
  - Rodar todos os checks de lint em sequência:
    ```bash
    pnpm lint           # Expected: exit 0, zero diagnostics
    pnpm exec tsc --noEmit  # Expected: exit 0
    ```
  - Se falhar: identificar qual task introduziu o erro, reverter ou corrigir
  - Se passar: salvar log de evidência

  **Must NOT do**:
  - NÃO desabilitar regras adicionais para fazer passar
  - NÃO commitar com supressões novas sem justificativa

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with F2, F3, F4)
  - **Parallel Group**: Final Verification
  - **Blocks**: PR merge
  - **Blocked By**: Waves 1-6

  **QA Scenarios**:

  ```
  Scenario: Full lint + type check
    Tool: Bash
    Steps:
      1. pnpm lint → exit 0
      2. pnpm exec tsc --noEmit → exit 0
    Expected Result: Both exit 0
    Evidence: .sisyphus/evidence/final-lint.txt, .sisyphus/evidence/final-tsc.txt
  ```

- [ ] F2. Full test run — vitest + playwright

  **What to do**:
  - Rodar todos os testes:
    ```bash
    pnpm test           # vitest run — exit 0, all passing
    pnpm test:e2e       # playwright test — exit 0 (pode pular se não houver e2e)
    ```

  **Must NOT do**:
  - NÃO modificar testes para fazer passar
  - NÃO pular testes quebrados — corrigir a causa

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with F1, F3, F4)
  - **Parallel Group**: Final Verification
  - **Blocks**: PR merge
  - **Blocked By**: Waves 1-6

  **QA Scenarios**:

  ```
  Scenario: All tests pass
    Tool: Bash
    Steps:
      1. pnpm test 2>&1
      2. Assert exit code = 0
      3. Assert final line contains "Tests" and no failures
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/final-test.txt
  ```

- [ ] F3. Full build check — pnpm build + knip

  **What to do**:
  - Rodar build de produção e knip:
    ```bash
    pnpm build          # Expected: exit 0, success message
    pnpm knip           # Expected: no warnings about tailwindcss
    ```

  **Must NOT do**:
  - NÃO pular se build falhar — corrigir

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with F1, F2, F4)
  - **Parallel Group**: Final Verification
  - **Blocks**: PR merge
  - **Blocked By**: Waves 1-6

  **QA Scenarios**:

  ```
  Scenario: Build + knip pass
    Tool: Bash
    Steps:
      1. pnpm build → exit 0
      2. pnpm knip → exit 0, no tailwindcss
    Expected Result: Both exit 0
    Evidence: .sisyphus/evidence/final-build.txt, .sisyphus/evidence/final-knip.txt
  ```

- [ ] F4. Playwright visual regression — 4 pages (home, game, bundles, search)

  **What to do**:
  - Usar Playwright para capturar screenshots das 4 páginas principais
  - Verificar console: sem erros de imagem ou hostname
  - Verificar network: todas as imagens carregam (HTTP 200)
  - Comparar com screenshots de referência (se T12 salvou)

  **Must NOT do**:
  - NÃO rodar em headless modo se debug necessário

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`webapp-testing`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with F1, F2, F3)
  - **Parallel Group**: Final Verification
  - **Blocks**: PR merge
  - **Blocked By**: Waves 1-6

  **QA Scenarios**:

  ```
  Scenario: 4 pages render without visual regressions
    Tool: Playwright
    Steps:
      1. Navigate to / → screenshot
      2. Navigate to /game/146 → screenshot
      3. Navigate to /bundles → screenshot
      4. Navigate to /search?q=rpg → screenshot
      5. Check console: no errors matching "(Image|hostname|404|500)"
    Expected Result: All pages render, no errors in console
    Evidence: .sisyphus/evidence/final-screenshots/
  ```

---

## Commit Strategy

- **Wave 1**: `fix: stabilize quality pipeline — knip config + biome overrides`
- **Wave 2**: `fix: replace any types with proper TypeScript types`
- **Wave 3**: `fix: migrate img to next/image with remotePatterns`
- **Wave 4**: `fix: replace forEach side-effects with for..of`
- **Wave 5**: `fix: extract @theme to tokens.css, restore biome coverage`
- **Wave 6**: `chore: ci hardening — knip audit, tracking issues, key rotation check`
- **Wave FINAL**: `chore: final verification — screenshots, lint, build, test pass`

---

## Success Criteria

### Verification Commands
```bash
pnpm lint                          # Expected: exit 0, zero diagnostics
pnpm exec tsc --noEmit             # Expected: exit 0
pnpm test                          # Expected: all passing
pnpm build                         # Expected: exit 0
pnpm knip                          # Expected: no tailwindcss in output
grep -c "biome-ignore" src/**/*.ts src/**/*.tsx | grep -v ":0$"  # Expected: ≤5 files
```

### Final Checklist
- [ ] biome.json sem `"off"` globais (noArrayIndexKey, noDangerouslySetInnerHtml, useSemanticElements, noNonNullAssertion)
- [ ] knip.json com ignoreDependencies configurado
- [ ] globals.css fora do .gitignore
- [ ] tokens.css criado e importado
- [ ] CI workflow inalterado (ordem lint→build correta)
- [ ] SonarCloud quality gate verde
- [ ] Vercel deploy funcionando
