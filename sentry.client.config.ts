import * as Sentry from '@sentry/nextjs';
import { beforeBreadcrumb, beforeSend } from '@/lib/sentry-filter';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration(), Sentry.browserTracingIntegration()],
  beforeSend,
  beforeBreadcrumb,
});
