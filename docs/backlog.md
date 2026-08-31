# Autonomous Dev Loop — Backlog

Fonte única de tarefas pro loop. Cada tarefa = 1 PR. O loop pega a primeira
tarefa `status: todo` com todas as dependências `done`.

Formato:

```
## T[N]: <título>
- status: todo | doing | blocked | done | skipped
- depends: T[N] (ou none)
- risk: auto | review   ← auto = merge automático se CI verde; review = espera humano
- spec: <o que é feito, critérios de aceite>
```

Regras do loop:
1. Máx 1 tarefa `doing` por vez.
2. Se CI falhar 2× seguidas no mesmo PR → marca `blocked`, anota o erro, segue pra próxima.
3. Nunca toca em: `.env.example` (só adiciona vars novas comentadas), migrations aplicadas, secrets.
4. Toda task precisa passar o gauntlet completo antes do merge (biome, tsc, vitest, build, e2e, Sonar).

---

## T1: Sitemap dinâmico via generateSitemaps()
- status: done
- depends: none
- risk: auto
- spec: Migrar sitemap custom (~250 linhas em 7 route handlers) para
  `generateSitemaps()` nativo do Next.js. Deleta src/app/sitemap/_lib/,
  static.xml/, collections.xml/, deals.xml/, games-0..4.xml/. Aceite:
  /sitemap.xml retorna index válido; cada child URL responde XML válido;
  testes unitários de sitemap atualizados; biome/tsc/build verdes.

## T2: Testes de rota pros crons de digest
- status: done
- depends: none
- risk: auto
- spec: route tests para weekly-free-games e top-deals-digest seguindo o
  padrão de tests/unit/routes/stripe-webhook.test.ts (mock @/db, mock
  getDeals). Casos: auth 401 sem secret, resposta vazia quando sem deals,
  happy path chama sendDigestToSubscribers, erro → handleCronError.

## T3: Extrair layout compartilhado das newsletter pages
- status: done
- depends: none
- risk: auto
- spec: confirmed/page.tsx e unsubscribed/page.tsx compartilham estrutura —
  extrair NewsletterStatusPage({title, message}) em src/components/.
  Remove CPD exclusion de src/app/newsletter/** do sonar-project.properties.
  Aceite: visual idêntico, sonar duplication passa sem exclusão.

## T4: Rate limit no postback receiver
- status: blocked
- depends: none
- risk: review
- spec: POST /api/postback aceita N req/min por IP usando assertRateLimit
  existente (limite alto: 60/min — networks fazem retry burst). Teste:
  61ª chamada dentro da janela retorna 429. Não pode bloquear postbacks
  legítimos de redes distintas.

## T5: Página /deals índice navegável
- status: todo
- depends: none
- risk: auto
- spec: Hub linkando by-store ×13, by-genre ×4 e under-X ×3 com contagem
  de ofertas ativas. JSON-LD CollectionPage. Entrada no sitemap + robots.
  Aceite: build verde, página prerenderizada, links todos 200.

## T6: Health check estendido (deps externas)
- status: todo
- depends: none
- risk: auto
- spec: /api/health checa CheapShark (HEAD com timeout 3s) e Typesense
  ping, além do DB. Response inclui { db, cheapshark, typesense }.
  Status 200 se DB ok (degradado tolerante), 503 só se DB cair.

## T7: Blog infra mínima (MDX local)
- status: todo
- depends: T5
- risk: review
- spec: /blog/[slug] lendo markdown de content/blog/*.md com frontmatter
  (title, description, date, dealIds). Render server-side, JSON-LD
  BlogPosting, sitemap entry. Sem CMS, sem deps novas além de um parser
  md mínimo já presente ou marked. Aceite: 1 post seed "Free games this
  week" renderiza com CTA pros deals citados.

## T8: Cron semanal gera draft de blog post
- status: todo
- depends: T7, T2
- risk: review
- spec: Novo endpoint /api/cron/weekly-blog-post agendado no cron.yml
  (Monday 13h UTC): pega top free games, gera markdown no formato T7,
  salva como draft (frontmatter published: false). Quality gate inline:
  mínimo 600 palavras, ≥3 deals verificados, slug único. Humano publica
  trocando flag.

## T9: Admin revenue: filtro por período + CSV export
- status: todo
- depends: none
- risk: review
- spec: /admin/revenue ganha select 7d/30d/90d/all + botão export CSV
  (clicks e conversions agregados por store). Server-side only, admin gate
  existente mantido.

## T10: Lighthouse CI budget
- status: todo
- depends: none
- risk: auto
- spec: Adicionar lhci ao nightly.yml: rodar contra preview URL, budgets
  LCP < 2.5s, CLS < 0.1, TBT < 300ms nas páginas /, /deals/under-10,
  /search. Falha = check vermelho no run nightly (não bloqueia PRs).
