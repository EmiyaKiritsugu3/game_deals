# Sessão Retrospectiva — PR #10 Quality Fix

**Data**: 2026-06-12/13 | **Duração**: ~5h | **Modelo**: opencode-go/deepseek-v4-pro  
**Resultado**: PR merged. 30 commits. 94 arquivos. +5331/-829.

---

## Resumo do Fluxo

```
Planejamento (Prometheus) → Execução (Atlas) → Correções CI/SonarCloud → Merge
     ↑                          ↑                      ↑
  audit profundo          6 waves paralelas      8 issues SonarCloud
  Metis validation        24 tasks atômicas      + CI build fix
  Momus review            5 commits principais   + env vars setup
```

---

## Lições Críticas

### 1. OOM Killer — Dev Server em Subagent Paralelo

**Evento**: T23 (Playwright E2E via `visual-engineering`) iniciou `next-server` com 30GB VSZ. 5 subagents rodando simultaneamente. kswapd0 acionou OOM killer. `next-server` (PID 1195933, oom_score_adj:200) foi morto. PC do usuário desligou.

**Root cause**: `next-server` (Next.js 16 + Turbopack + Tailwind v4) alocou 30GB de virtual memory. Com Node.js V8 reservando address space, o kernel Linux com `overcommit_memory=0` considera VSZ como compromisso de memória real.

**Prevenção**:
- ⛔ NUNCA dev server dentro de subagent paralelo
- ⛔ Máximo 3 subagents quando qualquer um spawna processo filho
- ⛔ `pnpm build && pnpm start` (não `pnpm dev`) para E2E
- ⛔ Verificar `free -h` antes de disparar subagent `visual-engineering`
- ⛔ VSZ importa — não é "só virtual" com overcommit=0

### 2. GitHub Actions — Workflow do Branch Base

**Evento**: Adicionamos `env:` vars no `ci.yml` do `quality-pipeline` mas CI continuou falhando com "Supabase env vars not set".

**Root cause**: Para eventos `pull_request`, GitHub Actions usa o workflow do branch BASE (main), não do feature branch. É medida de segurança. O `main` não tinha os env vars.

**Solução**: Configurar secrets/variables no repositório GitHub (`gh secret set` / `gh variable set`) e referenciá-los com `${{ secrets.X }}` no workflow. OU mergear as mudanças de workflow pro main primeiro.

### 3. SonarCloud ≠ Biome

**Evento**: Arquivos passavam `biome check` mas SonarCloud ainda reportava issues.

**Root cause**: SonarCloud NÃO lê comentários `// biome-ignore`. Cada ferramenta tem seu próprio conjunto de regras. Ex: `key={index}` com `// biome-ignore noArrayIndexKey` passava Biome mas falhava SonarCloud `typescript:S6479`.

**Solução**: Resolver a causa raiz em vez de suprimir. `key={_entry.name}` funciona em ambas ferramentas.

### 4. Subagents "Deep" — Output Explosion

**Evento**: Subagents `deep` (T5 CheapShark types) produziram 16k+ bytes de análise que foram truncados e salvos em `/home/emiyakiritsugu/.local/share/opencode/tool-output/`. Vários arquivos de tool output chegaram a 828KB.

**Root cause**: `deep` e `visual-engineering` fazem análise extensiva (lendo múltiplos arquivos, explorando alternativas, verificando tipos). Cada output é carregado no context window do orchestrator.

**Prevenção**: Preferir `quick` para tarefas bem definidas. Reservar `deep` para problemas genuinamente complexos. Limitar a 1 subagent `deep` por vez.

### 5. rtk wrapper ≠ biome binary

**Evento**: Subagent T1 usou `rtk lint` para contar violações e reportou 0 para todas as regras. Era falso — `rtk lint` é wrapper customizado que chama ESLint (não instalado), não Biome.

**Root cause**: Confusão entre `rtk` (custom CLI tool wrapper) e comandos reais.

**Solução**: SEMPRE usar `./node_modules/.bin/biome check .` para verificação. NUNCA confiar em `rtk lint` para Biome.

### 6. boulder.json — Trailing Newline Persistente

**Evento**: `biome check` falhou repetidamente no CI por falta de trailing newline em `.sisyphus/boulder.json`. Cada subagent que modificava o arquivo removia o newline.

**Root cause**: `json.dump()` do Python não adiciona trailing newline. Subagents modificavam boulder.json sem adicionar `\n` final.

**Solução**: Após cada modificação do boulder.json: `python3 -c "json.dump(data, f, indent=2); f.write('\n')"`. Ou adicionar `.sisyphus/boulder.json` ao `.gitignore` do Biome (mas idealmente consertar a causa).

### 7. Subagents Analisam em Vez de Executar

**Evento**: Múltiplos subagents `quick` retornaram análise detalhada do problema em vez de aplicar as edições. Ex: SonarCloud fixes — subagent respondeu com "Análise: 3 issues encontradas, sugestões de correção..." sem editar os arquivos.

**Root cause**: Instruções ambíguas. Sistema de subagents tende a "pensar" antes de "agir".

**Solução**: Prefixar prompts com "APPLY exact edits immediately. DO NOT analyze. DO NOT plan." e fornecer o código exato a ser substituído.

### 8. Service Role Key — Não Rotacionada

**Evento**: Subagent T20 verificou que a chave `sb_secret_oJ5NVQZWXUegZmlFFanIcg_nxdv90wD` vazada em commit antigo (c710732) ainda está ATIVA. Retorna HTTP 200 na API do Supabase.

**Ação**: ⚠️ Rotacionar IMEDIATAMENTE em https://supabase.com/dashboard/project/scsbermcpukyxfwcuvls/settings/api

### 9. .env.example — Nome de Variável Errado

**Evento**: `.env.example` usava `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` mas o código (`middleware.ts`, `server.ts`, `client.ts`) usava `NEXT_PUBLIC_SUPABASE_ANON_KEY`. O CI copiava `.env.example` para `.env.local` e o build falhava.

**Solução**: Corrigir `.env.example` para usar `ANON_KEY`. Commitado e mergeado.

### 10. `<dialog>` Nativo — Solução Elegante

**Evento**: AddToListModal usava `<div role="dialog">` com handlers manuais de Escape/click. SonarCloud flagava 4 issues (S6819 + S6847 × 2).

**Solução**: Converter para `<dialog>` nativo com `.showModal()`/`.close()`. O elemento nativo já trata Escape, backdrop click, e focus trapping. Remove 4 issues com 1 mudança.

### 11. Recharts API Exige `any`

**Evento**: Formatters do Recharts (`Tooltip`, `Bar`) exigem assinatura `(value: any, name: any) => ...`. Tentar tipar restritamente quebra compatibilidade.

**Solução**: Manter `any` na fronteira da biblioteca com comentário documentado. Não é dívida técnica, é constraint da API externa.

### 12. Limpar Processos Órfãos

**Evento**: `next-server` e `chromium` ficaram rodando após crash do T23.

**Solução**: Sempre após subagent `visual-engineering`: `pkill -f "next-server" && pkill -f "chromium"`.

---

## Métricas da Sessão

| Métrica | Valor |
|---------|-------|
| Commits | 30 |
| Arquivos alterados | 94 |
| Linhas adicionadas | 5331 |
| Linhas removidas | 829 |
| Subagents disparados | ~20 |
| Waves concluídas | 7/7 |
| Testes adicionados | 23 |
| Issues SonarCloud resolvidas | 8 |
| Regras Biome off→override | 4 |
| Supressões removidas | ~30 |
| OOM kills | 1 |
| Branches deletadas | 1 |

---

## O Que Foi Bem

1. **Planejamento prévio sólido**: Audit + Metis + Momus reduziram surpresas
2. **Waves atômicas**: Cada wave commitável isoladamente, CI passando entre ondas
3. **Correções de causa raiz**: `any` → tipos, `<img>` → `<Image>`, `forEach` → `for..of`
4. **SonarCloud resolvido**: Todas 8 issues fechadas com correções reais
5. **CI infra preparada**: Secrets/variables configurados, workflow usa SHA hash

## O Que Melhorar

1. **Não rodar dev server em subagent**: OOM foi evitável
2. **Verificar output de subagent**: T1 reportou contagens falsas (rtk vs biome)
3. **Subagent "quick" não executa**: Precisa de prompts mais diretos
4. **Boulder.json trailing newline**: Bug repetitivo, precisa de automação
5. **CI workflow do main**: Deveria ter sido corrigido ANTES do feature branch

---

## Ações Pendentes

- [ ] Rotacionar service_role key no Supabase
- [ ] Rodar `pnpm build` localmente pra confirmar CI
- [ ] Adicionar `data-testid` nos componentes pra facilitar E2E futuros
- [ ] Configurar SonarCloud quality gate para "new code only"
