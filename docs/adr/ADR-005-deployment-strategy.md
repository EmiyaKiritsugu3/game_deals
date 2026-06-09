# ADR-005: Deployment Strategy — Vercel com SSR Fallback

**Status**: Aceito
**Data**: 2026-06-09
**Autor**: EmiyaKiritsugu3

---

## Contexto

O GameDeals é um site de afiliados onde **SEO e disponibilidade** são críticos:
- Páginas de jogos/deals precisam ser indexadas (SSR/ISR)
- APIs externas (CheapShark, IGDB) podem falhar ou ter latency alta
- Build não pode falhar por API externa indisponível
- Deploy deve ser automático, zero-downtime, com rollback fácil
- Precisa de Cron Jobs para price alerts
- Analytics privacy-friendly

Opções:
| Plataforma | Pros | Contras |
|------------|------|---------|
| **Vercel** | Next.js native, Edge Network, ISR/SSR streaming, Cron Jobs, Analytics, Preview deployments, Rollback 1-click | Vendor lock-in; custo escala com tráfego |
| **Netlify** | Similar ao Vercel, Edge Functions | Next.js support menos nativo; Cron limitado |
| **Railway/Render + Docker** | Controle total, custo previsível | Ops overhead; SSL, CDN, rollback manual |
| **AWS Amplify** | Integração AWS | Complexo; Next.js support histórico ruim |
| **Self-hosted (VPS + Coolify)** | Controle total, custo fixo | Ops overhead alto; não recomendado para MVP |

## Decisão

**Vercel (Pro/Enterprise conforme escala)**

### Configuração Crítica

#### 1. SSR Fallback na Home (`src/app/page.tsx`)
```typescript
export const dynamic = 'force-dynamic'
// Ou para ISR com revalidação:
// export const revalidate = 300 // 5 min
```
**Por que**: Evita build-time data fetching. Se CheapShark cai no build, o deploy não falha. A página renderiza no request time com `try/catch` → fallback data.

#### 2. API Resilience em `src/services/api.ts`
```typescript
async function fetchDeals() {
  try {
    const data = await cheapsharkFetch();
    return transform(data);
  } catch (e) {
    console.error('[API] CheapShark failed, using fallback:', e);
    return fallbackDeals; // src/data/fallbackDeals.ts
  }
}
```
Todas as chamadas externas têm `try/catch` + fallback estático.

#### 3. `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/check-prices", "schedule": "0 */6 * * *" }
  ],
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 }
  },
  "headers": [
    { "source": "/(.*)", "headers": [{ "key": "X-Content-Type-Options", "value": "nosniff" }] }
  ]
}
```

#### 4. Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (apenas server)
CRON_SECRET
GROQ_API_KEY (opcional, para STT)
ELEVENLABS_API_KEY (opcional, para TTS)
# Affiliate networks
RAKUTEN_AFFILIATE_ID
CJ_AFFILIATE_ID
AWIN_AFFILIATE_ID
```

#### 5. Analytics
```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
export default function RootLayout({ children }) {
  return <html>...<body>{children}<Analytics /></body></html>;
}
```
Privacy-friendly, zero cookies, Core Web Vitals automáticos.

### Estratégia de Deploy

| Ambiente | Trigger | Branch | URL |
|----------|---------|--------|-----|
| **Production** | Push to `main` | `main` | `gamedeals.br` (custom domain) |
| **Preview** | Push to qualquer branch / PR | `*` | `gamedeals-git-<branch>-user.vercel.app` |
| **Development** | Local `vercel dev` | Local | `localhost:3000` |

**Rollback**: 1-click no dashboard Vercel → promove deploy anterior a production.

### Performance Config

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cheapshark.com' },
      { protocol: 'https', hostname: 'images.igdb.com' },
      { protocol: 'https', hostname: 'cdn.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
};
```

## Consequências

### Positivas
- **Zero-config Next.js**: Otimizações automáticas (font optimization, image optimization, script loading)
- **Edge Network**: Baixa latency global; Brasil servido por edge GRU/SP
- **ISR/SSR Streaming**: TTFB baixo; HTML streaming para conteúdo acima da dobra
- **Preview Deployments**: Todo PR tem URL testável; stakeholders revisam sem local setup
- **Cron Jobs nativos**: Price alerts sem infra extra
- **Analytics included**: Sem Google Analytics/GDPR headaches

### Negativas / Trade-offs
- **Custo**: Free tier (100GB bandwidth/mês) → Pro ($20/mês) → Enterprise. Para afiliados com tráfego orgânico, pode escalar rápido.
- **Vendor lock-in**: `vercel.json`, Edge Functions, ISR são proprietários. Migração futura = rewrite.
- **Function timeout**: 30s max (Pro) / 10s (Free). Price check cron deve ser otimizado.
- **Build time**: Free tier = 6000 min/mês. Next.js 14 + dependencies pode passar; otimizar com `turbo` cache.

### Mitigações
- **Budget alerts**: Configurar alerta em $15/mês no Vercel
- **Static export fallback**: `output: 'export'` como plano B (perde SSR/ISR)
- **Monitoring**: Vercel Analytics + Logs + Speed Insights (gratuito)

---

## Referências
- [Vercel Deployment Guide](../vercel_deployment_guide.md)
- [Clean Deployment Guide](../clean_deployment_guide.md)
- `vercel.json` — config de crons, headers, functions
- `next.config.ts` — config de images, experimental