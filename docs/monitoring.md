# Monitoring & Observability

| Metadata | |
|---|---|
| Last updated | 2026-06-18 |
| Status | Active |

## Stack

| Tool | Purpose | Cost |
|------|---------|------|
| Sentry | Error tracking + release monitoring | Free tier |
| Vercel Analytics | Page views, affiliate clicks, alert triggers | Free tier (Hobby) |
| Vercel Runtime Logs | Function logs (serverless, edge) | Built-in |
| GitHub Actions | CI pipeline health | Free tier |

## Sentry

### Setup

Configured via `@sentry/nextjs` in `next.config.ts`. Source maps uploaded on production builds.

### Key Config

```ts
// next.config.ts
withSentryConfig(nextConfig, {
  widenClientFileUpload: true,
  webpack: { automaticVercelMonitors: true },
});
```

### Environment Variables

| Variable | Required |
|----------|----------|
| `SENTRY_AUTH_TOKEN` | Production builds (source maps upload) |

### What's Tracked

- **Client**: React errors, unhandled promises, CSP violations
- **Server**: Route handler errors, cron failures, API timeouts
- **Release**: Automatic release creation on deploy (Vercel integration)

### Alerting (Planned)

- [ ] Cron failures (ingest-prices, check-alerts, reindex-typesense)
- [ ] CheapShark API error rate spike
- [ ] Page load regression (>2s p95)

## Vercel Analytics

### Setup

```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
<Analytics />
```

### Custom Events

Events tracked via `src/lib/analytics.ts`:

| Event | Trigger | Location |
|-------|---------|----------|
| `affiliate_click` | User clicks outbound deal link | `src/app/out/[storeId]/[gameSlug]/route.ts` |
| `alert_triggered` | Price alert fires | `src/app/api/cron/check-alerts/route.ts` |
| `alert_created` | User creates price alert | `src/components/PriceAlertModal.tsx` |
| `alert_deleted` | User removes price alert | `src/components/AlertCard.tsx` |

### Dashboard

Check **Vercel Dashboard → Analytics** for:
- Page views (top pages, referrers)
- Custom events (affiliate clicks, alert activity)
- Web vitals (LCP, CLS, INP)

## Cron Health

### Endpoints

| Endpoint | Schedule | Timeout | Purpose |
|----------|----------|---------|---------|
| `/api/cron/ingest-prices` | Every 4h | 240s | Fetch CheapShark deals → upsert DB |
| `/api/cron/check-alerts` | Every 15min | 290s | Compare prices → trigger notifications |
| `/api/cron/reindex-typesense` | Daily | 300s | Rebuild Typesense search index |

### Monitoring via Vercel Cron

All cron routes protected by `CRON_SECRET` header. Each returns structured JSON:

```json
{
  "success": true,
  "deals": 42,
  "games": 10,
  "duration": "1.2s"
}
```

On failure:
```json
{ "error": "CheapShark API returned 429", "code": "API_ERROR" }
```

### Health Check Script (Planned)

```bash
# Check cron endpoints respond to health pings
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://gamedeals.vercel.app/api/cron/ingest-prices
```

### Alerts to Configure

- [ ] Sentry alert: any cron returns non-200
- [ ] Sentry alert: CheapShark error rate > 10% in 1h
- [ ] Vercel alert: function timeout or cold start spike
- [ ] Uptime monitoring (e.g., BetterStack, UptimeRobot)

## Dashboard Links

| Dashboard | URL |
|-----------|-----|
| Sentry | https://sentry.io (org + project) |
| Vercel Analytics | https://vercel.com/dashboard → GameDeals → Analytics |
| Vercel Logs | https://vercel.com/dashboard → GameDeals → Logs |
| GitHub Actions | https://github.com/EmiyaKiritsugu3/game_deals/actions |
