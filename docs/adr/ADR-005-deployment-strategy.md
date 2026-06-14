# ADR-005: Deployment Strategy — Vercel + OpenNext (Exit Strategy)

**Status**: Aceito
**Data**: 2026-06-09 (Atualizado 2026-06-10)
**Autor**: EmiyaKiritsugu3

---

## Contexto

GameDeals é um app Next.js otimizado para Edge/Serverless. Precisamos:
- Deploy zero-ops para MVP (solo dev, sem infra)
- Performance global (CDN, edge caching, ISR)
- Cron jobs para price ingestion, search sync
- Analytics e Core Web Vitals tracking
- Portabilidade futura (não depender só de Vercel)

---

## Decisão

### Produção: Vercel (Pro Plan)

**Por que Vercel?**
- **Next.js 16.2 Adapter API + Turbopack**: Deploy nativo, zero config
- **Edge Network**: 100+ regiões, <50ms TTFB Brasil
- **Cron Jobs nativos**: `vercel.json` schedule
- **Analytics + Speed Insights**: Core Web Vitals tracking
- **Preview Deployments**: Cada PR → preview URL (QA automático)
- **ISR/PPR**: On-demand revalidation via webhooks/revalidateTag

### Exit Strategy: OpenNext V2 + Adapter API

**Next.js 16.2 Adapter API (Março 2026)**:
- Build output tipado, versionado (não quebra mais com updates)
- **OpenNext V2** suporta: AWS Lambda, Cloudflare Workers, Netlify, Google Cloud Run
- Migração futura viável sem mudar código

```json
// vercel.json
{
  "cron": [
    { "path": "/api/cron/ingest-deals", "schedule": "0 3 * * *" },
    { "path": "/api/cron/sync-search", "schedule": "0 4 * * *" },
    { "path": "/api/cron/refresh-featured", "schedule": "0 */4 * * *" }
  ],
  "functions": {
    "api/cron/*.ts": { "memory": 512, "maxDuration": 300 }
  }
}
```

### CI/CD: GitHub Actions + pnpm + Biome + Vitest

```yaml
# .github/workflows/ci.yml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint           # Biome check
      - run: pnpm vitest run --coverage # Unit tests
      - run: pnpm playwright install    # E2E
      - run: pnpm playwright test
  deploy:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: pnpm vercel --prod
```

---

## Consequências

### Positivas
- **Zero-ops MVP**: `git push` → deploy automático
- **Performance global**: Edge CDN, ISR, PPR
- **Portabilidade**: Adapter API + OpenNext = Vercel não é lock-in
- **CI/CD integrado**: Lint → Test → Deploy automático
- **Cron nativo**: Schedule no `vercel.json`, sem infra extra

### Negativas
- **Vercel Pro**: $20/mês (cron jobs, analytics)
- **Cold start**: Edge Functions podem ter ~100ms-1s (mitigado: cron jobs não são user-facing)
- **OpenNext ainda imaturo**: AWS deploy requer configuração extra
- **Serverless limits**: 10s timeout, 50MB response (aceitável para API aggregator)

---

## Referências
- [Next.js 16.2 Adapter API](https://nextjs.org/blog/next-16-2) — Stable adapter system
- [Next.js Across Platforms](https://nextjs.org/blog/nextjs-across-platforms) — OpenNext collaboration
- [OpenNext V2](https://opennext.js.org/aws) — AWS Lambda support
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Dependencies overview