import * as Sentry from '@sentry/nextjs';
import { beforeBreadcrumb, beforeSend } from '@/lib/sentry-filter';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  integrations: [Sentry.anrIntegration()],
  beforeSend,
  beforeBreadcrumb,
});
