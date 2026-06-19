# GameDeals — Metodologia de Desenvolvimento v1.0

Metodologia de desenvolvimento assistida por IA para o projeto GameDeals. Baseada em evidências de 60+ fontes (arXiv 2024-2026, post-mortems de produção, documentação oficial Anthropic/OpenAI/Cognition). Otimizada para qualidade máxima com eficiência de tokens.

---

## 1. Princípios Fundamentais

### 1.1. Separe planejamento de execução (com exceção)

O orquestrador (Sisyphus) decompõe tarefas multi-file em contratos. Agentes especializados executam em worktrees isolados.

**Exceção:** Single-file tasks bem delimitadas não precisam de planner separado — o próprio agente internaliza o planejamento.

**Evidência:** CodeDelegator (arXiv 01/2026) — EPSS: planner nunca escreve, coder nunca vê histórico. Cognition/Devin: "Writes stay single-threaded, agents contribute intelligence not actions."

### 1.2. Edge Case Enumeration pra código existente, TDD estrito pra código novo

| Situação | Método | Garantia |
|----------|--------|----------|
| Código já funciona | Agente lê fonte → enumera edge cases → escreve testes | Branch ≥85% + edge cases listados no commit |
| Feature nova / Bugfix | RED (falha genuinamente) → GREEN (mínimo pra passar) → REFACTOR | Teste prova que o bug existia e foi corrigido |

RED falso em código existente é contraproducente — o TDAD Paradox (arXiv 03/2026) mostra que instruções de TDD sem contexto de quais testes verificar **aumentam** regressões de 6% para 10%.

**Evidência:** TDAD (arXiv 03/2026), Meta TestGen-LLM (ACM FSE 2024) — 73% acceptance rate, TDD for Code Generation (arXiv 02/2024) — testes como input melhoram corretude em 9-29%.

### 1.3. Quem escreve não revisa

Agente de implementação e agente de revisão são sessões isoladas. O revisor recebe apenas o diff + contrato de qualidade, nunca o raciocínio do implementador. Isso quebra o "same-model loop" onde asserções tautológicas passam despercebidas.

**Evidência:** Zenn.dev (03/2026) — 227 vs 20 testes (11×). Kitchen Loop (arXiv 03/2026) — 1,094+ PRs, zero regressões com verificação adversarial.

### 1.4. Branch coverage no gate, mutation no noturno

| Gate | Quando | Métrica | Limite |
|------|--------|---------|--------|
| Pre-push | Todo commit | Branch coverage | ≥85% por arquivo |
| CI noturno | 1×/dia (3am UTC) | Mutation score | ≥60% |

Branch coverage é rápido (<5min). Mutation testing é 10-100× mais lento mas é a prova real de que os testes detectam bugs.

**Evidência:** MutGen (arXiv 06/2025) — 100% line coverage pode significar 4% mutation score. TESTGENEVAL (ICLR 2025) — mutation score é a métrica principal do benchmark. DISTINCT (arXiv 06/2025) — 83% branch coverage → zero defeitos detectados sem semantic alignment.

### 1.5. Nada sai sem o gate passar

Nenhum agente declara "pronto" com base em raciocínio próprio. Só output de ferramenta tem valor probatório.

```
biome check .          → 0 errors
tsc --noEmit           → 0 errors
pnpm test:coverage     → thresholds met
SonarQube local        → 0 new issues vs baseline
```

**Evidência:** Post-mortem $1.7M (fintech, 05/2026) — sem portões = -340% qualidade. SPOQ (arXiv 06/2026) — dual gate com 10 métricas, limite 95%. Anthropic: "Never trust an agent's claim about its output."

### 1.6. Otimize por tokens, não por número de agentes

Métrica: ~3K tokens de contexto de tarefa por agente. Batch por complexidade, não por contagem de arquivos.

**Evidência:** Microsoft Research (04/2026) — tarefas agentivas 1000× mais tokens que chat, 30× variação na mesma tarefa, mais tokens ≠ mais precisão. Co-Coder (arXiv 06/2026) — "File-based parallel trades cost for speed without improving quality."

---

## 2. Arquitetura de Agentes

```
┌────────────────────────────────────────────┐
│            ORQUESTRADOR (Sisyphus)          │
│  Decompõe tarefas, define contratos,         │
│  NUNCA escreve código.                       │
│  Batch: 3-6 agentes em paralelo.             │
│  Métrica: ~3K tokens de contexto/agente.     │
└──────┬──────────────┬──────────────┬─────────┘
       │              │              │
  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
  │ SPEC    │   │ BUILD   │   │ REVIEW  │
  │ Leitura │   │ Escrita │   │ Leitura │
  │ apenas  │   │         │   │ apenas  │
  │         │   │         │   │         │
  │ Lê fonte│   │ Escreve │   │ Sessão  │
  │ Enumera │   │ testes  │   │ isolada │
  │ edge    │   │ + código│   │ Vê só   │
  │ cases   │   │ 5-8 arq │   │ diff +  │
  │         │   │         │   │ contrato│
  └─────────┘   └────┬────┘   └────┬────┘
                     │             │
                ┌────▼─────────────▼────┐
                │    GATE (determinístico) │
                │ biome → tsc → test →    │
                │ coverage → SonarQube    │
                └─────────────────────────┘
```

### 2.1. Regras não-negociáveis

- Worktree isolado por agente de escrita (nunca shared filesystem)
- Agente SPEC nunca escreve código
- Agente REVIEW nunca vê o raciocínio do BUILD (recebe só diff + contrato)
- REVIEW recebe sessão isolada com temperatura diferente do BUILD
- Máximo 2 níveis de profundidade (orquestrador → agente; agente NÃO spawna subagentes)
- Erro estrutural (missing dep, type error) → escala imediatamente, NUNCA retry

### 2.2. Quando usar multi-agente vs single-agent

| Tarefa | Arquitetura | Por que |
|--------|-------------|--------|
| 1-2 arquivos, escopo claro | Single agent | Overhead de coordenação > benefício |
| 8+ arquivos, domínios diferentes | Multi-agent (3-6 paralelos) | Contexto isolado, sem poluição |
| Feature nova complexa | SPEC → BUILD → REVIEW (3 fases) | Separação de responsabilidades |

### 2.3. Tipos de agentes e domínios

| Agente | Tipo | Ferramentas | Domínio |
|--------|------|-------------|---------|
| SPEC | explore/read-only | Read, Grep, AST-grep, LSP | Análise de código fonte |
| BUILD | unspecified-high/deep | Read, Write, Edit, Bash | Escrita de testes e código |
| REVIEW | unspecified-high | Read, Bash, LSP | Revisão adversarial de diff |

---

## 3. Contratos de Qualidade

### 3.1. Contrato SPEC

```
ENTRADA:  Lista de N arquivos + 1 arquivo de referência (padrão de teste)
SAÍDA:    Para cada arquivo:
          1. 3+ edge cases extraídos do código fonte
             (6+ para arquivos com >20 linhas ou >5 branches)
          2. Alvo de branch coverage: ≥85%
          3. Dependências de mock identificadas (stores, actions, APIs)
          4. Partes NÃO testáveis em jsdom sinalizadas (server components,
             route handlers)

MUST NOT:  Inventar edge cases inexistentes. Cada edge case deve
           referenciar uma linha ou branch específica do fonte.
```

### 3.2. Contrato BUILD

```
ENTRADA:  Contrato SPEC (edge cases + alvo + mocks)
SAÍDA:    Para cada arquivo:
          1. Arquivo de teste (.test.ts ou .test.tsx)
          2. 1 commit atômico por arquivo:

             test(scope): N tests (X% branch)

             Edge cases covered:
             - case 1 (linha X do fonte)
             - case 2 (branch Y do fonte)
             - ...

          3. Evidência de gate próprio:
             biome check <arquivo>     → 0 errors
             tsc --noEmit              → 0 errors
             pnpm test -- --run <arq>  → ALL pass

MUST NOT:  test.skip(), test.todo(), mock sem ler fonte real,
           asserção tautológica: expect(mock).toHaveBeenCalled()
           sem verificar output.
```

### 3.3. Contrato REVIEW

```
ENTRADA:  Diff do BUILD (git diff) + contrato SPEC
          NUNCA o raciocínio do BUILD.
          NUNCA a conversa do orquestrador com o BUILD.

SAÍDA:    1 de 3 vereditos:

APPROVED   □ Todo edge case do SPEC tem teste correspondente
           □ Nenhum test.skip()/test.todo()
           □ Mock fiel ao comportamento real (não introduz
             comportamento que o módulo real não tem)
           □ Nenhuma asserção tautológica
           □ Sanity check: 1 edge case aleatório — se o código
             mudasse incorretamente, o teste quebraria?

REJECTED   BUILD não cumpriu o contrato → volta pro BUILD
           com justificativa específica (qual edge case faltou,
           qual mock está errado)

SPEC_GAP   SPEC perdeu edge case que o código manifestamente
           cobre → volta pro SPEC complementar, depois BUILD refaz
```

### 3.4. Contrato GATE

```
ENTRADA:  Branch com todos os commits do BUILD
SAÍDA:    PASS (todos checks verdes) ou FAIL (lista de falhas)
TIMEOUT:  5 minutos total. Se não completar → FAIL.
MÁXIMO:   3 iterações. 4ª falha → escalar para humano.

CHECKS (ordem fixa, mais barato primeiro):
          1. biome check .              → 0 errors        (~30s)
          2. tsc --noEmit               → 0 errors        (~30s)
          3. pnpm test -- --run         → ALL pass        (~3s)
          4. pnpm test:coverage         → thresholds met  (~3s)
          5. SonarQube scan + poll       → 0 new issues   (~60s)
             - Executa sonar-scanner
             - Poll ce/task até completar (máx 30s)
             - Compara com baseline (13 issues atuais)

REGRA:     Se check N falhar, checks N+1 em diante NÃO executam.
           Corrigir → re-roda do check 1.
```

---

## 4. Gates de Verificação

### 4.1. Gate Local (pré-push)

Executado antes de qualquer push. Barato e rápido (~60s). Previne push de código quebrado antes de consumir recursos de CI.

**Nota:** Gate local e CI PR executam os mesmos checks. É intencionalmente redundante: o gate local usa cache local (rápido, ~60s); o CI PR faz fresh install sem cache (garante reprodutibilidade). Se o gate local passar mas o CI falhar, há uma diferença de ambiente que precisa ser investigada.

```
┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐
│ biome ✓  │→  │  tsc ✓   │→  │ test ✓    │→  │coverage ✓│→  push
└──────────┘   └──────────┘   └───────────┘   └──────────┘
                                                     │
                                               ┌─────▼──────┐
                                               │ SonarQube ✓│
                                               └────────────┘
```

### 4.2. CI de PR (todo push/PR no GitHub)

Roda no GitHub Actions. Bloqueia merge se falhar.

```
quality job:                    e2e job:
  biome → tsc → test →           build → Playwright →
  coverage → build →             upload report
  knip → fallow → SonarCloud
```

### 4.3. CI Noturno (3am UTC, main apenas)

Jobs pesados que não cabem no fluxo de PR. Informativos, não bloqueiam merge.

| Job | O que faz | Timeout | Status |
|-----|-----------|---------|--------|
| `mutation` | Stryker placeholder (≥60% target) | 90min | Planejado |
| `audit` | Knip strict + Fallow full | 15min | Ativo |
| `e2e-full` | Playwright + DB migrations reais | 20min | Ativo |
| `coverage-trend` | Coverage report (30-day retention) | 10min | Ativo |

### 4.5. Regra de subida de thresholds

```
Thresholds de coverage (vitest.config.ts) só podem ser aumentados
quando o coverage ATUAL já está ≥ ao novo threshold proposto.

Exemplo: coverage atual = 48.3% lines. Só pode subir threshold
para 50% se coverage ≥ 50% neste momento.

O commit de aumento de threshold usa --no-verify (o próprio aumento
faria o gate falhar por um instante). Imediatamente após, o gate
deve passar com o novo threshold.
```

### 4.6. Baseline SonarQube

| Regra | Arquivo | Severidade | Status |
|-------|---------|-----------|--------|
| S1607 | tests/e2e/fixtures/auth.ts | MAJOR | Aceito (test.skip intencional) |
| S7780 | src/middleware.ts | MINOR | Conhecido (String.raw no matcher) |
| S7924 | 11 arquivos .css | MAJOR | Falsos positivos (hsl(var(--primary))) |

**Regra:** Sprint N não pode introduzir issues NOVAS acima desta baseline. Issues existentes são suprimidas via NOSONAR ou marcadas como FALSE-POSITIVE no UI.

---

## 5. Fluxo Completo

### 5.1. Sprint (task multi-file complexa)

```
1. EXPLORE (paralelo, background)
   ├── Agente 1: codebase patterns
   ├── Agente 2: library docs (se necessário)
   └── Agente 3: test patterns existentes

2. PLAN (síncrono)
   └── Prometheus: decompõe em tasks, define ondas, dependências,
       escopo (quais arquivos cada agente cobre), ordem de execução.
       NÃO define edge cases — isso é responsabilidade dos SPEC agents.

3. EXECUTE (paralelo dentro de cada onda)
   ├── WAVE 1: SPEC agents (leitura, 3-6 paralelos)
   │   └── Output: contratos detalhados com edge cases + alvos
   │       + mocks + partes não-testáveis sinalizadas
   │
   ├── WAVE 2: BUILD agents (escrita, 3-6 paralelos)
   │   └── Output: commits atômicos, 1 por arquivo
   │
   ├── WAVE 3: REVIEW agents (leitura, 3-6 paralelos)
   │   └── Output: APPROVED / REJECTED / SPEC_GAP
   │
   └── WAVE 4: GATE
       ├── biome → tsc → test → coverage → SonarQube
       └── Output: PASS (push) ou FAIL (corrigir)

4. PR → CI → MERGE
```

### 5.2. Bugfix (single-file, escopo claro)

```
1. RED:
   └── Agente escreve teste que reproduz o bug → FAILS

2. GREEN:
   └── Agente escreve código mínimo pra passar → PASSES

3. REFACTOR:
   └── Agente limpa sem mudar comportamento → STILL PASSES

4. REVIEW:
   └── Sessão isolada, vê só diff + contrato → APPROVED/REJECTED

5. GATE:
   └── biome → tsc → test → push
```

### 5.3. Cleanup (deleções, configs)

```
1. Agente executa mudança atômica
2. biome → tsc → knip (confirma que nada quebrou)
3. 1 commit, push
```

---

## 6. Economia de Tokens

### 6.1. Regras de batch

| Complexidade da tarefa | Arquivos por agente | Tokens estimados |
|------------------------|---------------------|------------------|
| Alta (hooks, lógica complexa) | 3-5 | ~3K contexto |
| Média (componentes interactivos) | 5-8 | ~3K contexto |
| Baixa (render-only, lib pura) | 8-12 | ~3K contexto |

### 6.2. Práticas obrigatórias

- **Subagentes para pesquisa:** Exploração de codebase NUNCA no chat principal. Use explore agents em background.
- **Worktrees para writes:** Todo agente de escrita opera em worktree isolado. Sem conflitos, sem poluição.
- **Compressão de contexto:** Após 50% da janela preenchida, executar compactação.
- **Output de comando filtrado:** Saídas de build/teste pipeadas por filtro antes de entrar no contexto.
- **Nova sessão ao trocar de tarefa:** Sessões longas degradam performance do modelo. Tarefa nova = sessão nova.

### 6.3. Anti-padrões

| Anti-padrão | Custo | Correção |
|-------------|-------|----------|
| 1 agente por arquivo (34 agentes) | 510K tokens | 3-6 agentes com batch |
| Ler 15 arquivos no chat principal | Poluição de contexto | Subagente de pesquisa |
| RED falso (teste passa de 1ª) | Tempo + tokens desperdiçados | Edge Case Enumeration |
| Confiar em claim de agente sem verificar | Bugs escapam | Gate determinístico |
| Output de build 3000 linhas no contexto | 90% lixo | `grep` / `tail` / `--json` |

---

## 7. Referências

### Artigos científicos
- Alonso, Yovine, Braberman. "TDAD: Test-Driven Agentic Development." arXiv:2603.17973, 2026.
- MutGen. "Towards More Effective Fault Detection in LLM-Based Unit Test Generation." arXiv:2506.02954, 2025.
- TESTGENEVAL. ICLR 2025.
- Meta TestGen-LLM. "Automated Unit Test Improvement using LLMs at Meta." ACM FSE 2024.
- Kitchen Loop. "Unbeatable Tests." arXiv:2603.25697, 2026.
- CodeDelegator. arXiv:2601.14914, 2026.
- Co-Coder. arXiv:2606.00953, 2026.
- Spec-Driven Development in the Age of AI. arXiv:2602.00180, 2026.
- Microsoft Research. "How Do AI Agents Spend Your Money?" 2026.
- SPOQ Framework. arXiv:2606.03115, 2026.
- Zenn.dev. "Agent-Separated TDD: 227 vs 20 Tests." 03/2026.

### Fontes de produção
- Anthropic. Claude Code Best Practices. 2026.
- Cognition. "Verifying Agentic Development at Scale." 2026.
- Post-mortem: $1.7M multi-agent fintech swarm. Medium, 05/2026.
- AgentPatterns.ai. Bounded Batch Dispatch, Verify-Gated Completion. 2026.

---

## 8. Versionamento

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.1 | 2026-06-19 | Correções pós-auditoria: threshold multi-agent 5→8, fluxo SPEC explícito, REVIEW no bugfix, ref Zenn.dev, justificativa gate duplo, timeout total 5min, regra subida thresholds. |
| 1.0 | 2026-06-19 | Versão inicial. 6 princípios, arquitetura, contratos, gates, fluxo, token economy. Baseada em 60+ fontes. |
