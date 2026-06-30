/**
 * Sentry event filter — strips sensitive data before sending to Sentry.
 *
 * Applied via `beforeSend` / `beforeBreadcrumb` in all Sentry config files.
 */

import type { ErrorEvent, EventHint } from '@sentry/nextjs';

interface SentryEventLike {
  request?: { headers?: Record<string, string | undefined> };
  contexts?: {
    runtime?: Record<string, unknown>;
    env?: Record<string, unknown>;
  };
  message?: unknown;
  [key: string]: unknown;
}

interface SentryBreadcrumb {
  data?: Record<string, unknown>;
}

const SENSITIVE_HEADERS = ['authorization', 'cookie'] as const;

function stripSensitiveHeaders(target: SentryEventLike | null | undefined): void {
  if (!target) return;
  const headers = target.request?.headers;
  if (!headers) return;
  for (const header of SENSITIVE_HEADERS) {
    if (header in headers) {
      delete headers[header];
    }
  }
}

function stripRuntimeEnv(target: SentryEventLike | null | undefined): void {
  if (!target) return;
  const runtime = target.contexts?.runtime;
  if (runtime && 'env' in runtime) {
    delete runtime.env;
  }
}

/**
 * BeforeSend filter — removes authorization, cookie headers and
 * runtime env vars from Sentry error events.
 */
export function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  stripSensitiveHeaders(event as unknown as SentryEventLike);
  stripRuntimeEnv(event as unknown as SentryEventLike);
  return event;
}

/**
 * BeforeBreadcrumb filter — removes sensitive data from breadcrumbs.
 */
export function beforeBreadcrumb(breadcrumb: SentryBreadcrumb): SentryBreadcrumb {
  if (breadcrumb.data) {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(breadcrumb.data)) {
      if (key !== 'authorization' && key !== 'cookie') {
        safe[key] = value;
      }
    }
    breadcrumb.data = safe;
  }
  return breadcrumb;
}
