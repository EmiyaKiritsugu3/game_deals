# ADR-005: Deployment Strategy — Vercel + OpenNext (Exit Strategy)

**Status**: Accepted
**Date**: 2026-06-09 (Updated 2026-06-10)
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals is a Next.js app optimized for Edge/Serverless. We need:
- Zero-ops deploy for MVP (solo dev, no infra)
- Global performance (CDN, edge caching, ISR)
- Cron jobs for price ingestion, search sync
- Analytics and Core Web Vitals tracking
- Future portability (not depend only on Vercel)

---

## Decision

### Production: Vercel (Pro Plan)

**Why Vercel?**
- **Next.js 16.2 Adapter API + Turbopack**: Native deploy, zero config
- **Edge Network**: 100+ regions, <50ms TTFB Brazil
- **Native Cron Jobs**: `vercel.json` schedule
- **Analytics + Speed Insights**: Core Web Vitals tracking
- **Preview Deployments**: Each PR → preview URL (automatic QA)
- **ISR/PPR**: On-demand revalidation via webhooks/revalidateTag

### Exit Strategy: OpenNext V2 + Adapter API

**Next.js 16.2 Adapter API (March 2026)**:
- Typed, versioned build output (no longer breaks with updates)
- **OpenNext V2** supports: AWS Lambda, Cloudflare Workers, Netlify, Google Cloud Run
- Future migration viable without changing code

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

### CI/CD: GitHub Actions + Bun + Biome + Vitest

```yaml
# .github/workflows/ci.yml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: '1.3.13' }
      - run: bun ci                   # Install (frozen lockfile)
      - run: bunx biome check src/    # Lint (scoped to src/)
      - run: bunx vitest run --coverage # Unit tests
      - run: bunx playwright install   # E2E
      - run: bunx playwright test
  deploy:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: bunx vercel --prod
```

---

## Consequences

### Positive
- **Zero-ops MVP**: `git push` → automatic deploy
- **Global performance**: Edge CDN, ISR, PPR
- **Portability**: Adapter API + OpenNext = Vercel is not lock-in
- **Integrated CI/CD**: Lint → Test → Automatic Deploy
- **Native Cron**: Schedule in `vercel.json`, no extra infra

### Negative
- **Vercel Pro**: $20/month (cron jobs, analytics)
- **Cold start**: Edge Functions can have ~100ms-1s (mitigated: cron jobs are not user-facing)
- **OpenNext still immature**: AWS deploy requires extra configuration
- **Serverless limits**: 10s timeout, 50MB response (acceptable for API aggregator)

---

## References
- [Next.js 16.2 Adapter API](https://nextjs.org/blog/next-16-2) — Stable adapter system
- [Next.js Across Platforms](https://nextjs.org/blog/nextjs-across-platforms) — OpenNext collaboration
- [OpenNext V2](https://opennext.js.org/aws) — AWS Lambda support
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Dependencies overview