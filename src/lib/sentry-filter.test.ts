import { describe, expect, it } from 'vitest';
import { beforeBreadcrumb, beforeSend } from './sentry-filter';

type TestEventInput = Parameters<typeof beforeSend>[0];

describe('beforeSend', () => {
  it('strips authorization header from events', () => {
    const event = {
      request: {
        headers: {
          authorization: 'Bearer secret123',
          'content-type': 'application/json',
        },
      },
    } as unknown as TestEventInput;

    const result = beforeSend(event, {});

    const headers = result?.request?.headers as Record<string, unknown> | undefined;
    expect(headers).not.toHaveProperty('authorization');
    expect(headers?.['content-type']).toBe('application/json');
  });

  it('strips cookie header from events', () => {
    const event = {
      request: {
        headers: {
          cookie: 'session=abc123; token=xyz',
          'user-agent': 'Mozilla/5.0',
        },
      },
    } as unknown as TestEventInput;

    const result = beforeSend(event, {});

    const headers = result?.request?.headers as Record<string, unknown> | undefined;
    expect(headers).not.toHaveProperty('cookie');
    expect(headers?.['user-agent']).toBe('Mozilla/5.0');
  });

  it('strips runtime env vars from events', () => {
    const event = {
      contexts: {
        runtime: {
          env: {
            DATABASE_URL: 'postgres://secret',
            NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.co',
            NODE_ENV: 'production',
          },
        },
      },
    } as unknown as TestEventInput;

    const result = beforeSend(event, {});

    const contexts = result?.contexts as Record<string, unknown> | undefined;
    const runtime = contexts?.runtime as Record<string, unknown> | undefined;
    expect(runtime && 'env' in runtime).toBe(false);
  });

  it('returns event unchanged when no sensitive data present', () => {
    const event = {
      request: { headers: { 'user-agent': 'Mozilla/5.0' } },
    } as unknown as TestEventInput;

    const result = beforeSend(event, {});

    const headers = result?.request?.headers as Record<string, unknown> | undefined;
    expect(headers?.['user-agent']).toBe('Mozilla/5.0');
  });
});

describe('beforeBreadcrumb', () => {
  it('strips authorization and cookie from breadcrumb data', () => {
    const breadcrumb = {
      data: {
        authorization: 'Bearer secret',
        cookie: 'session=abc',
        url: '/api/test',
      },
    };

    const result = beforeBreadcrumb(breadcrumb);

    expect(result?.data).not.toHaveProperty('authorization');
    expect(result?.data).not.toHaveProperty('cookie');
    expect(result?.data?.url).toBe('/api/test');
  });

  it('returns breadcrumb unchanged when no sensitive data', () => {
    const breadcrumb = { data: { url: '/api/test', method: 'GET' } };

    const result = beforeBreadcrumb(breadcrumb);

    expect(result?.data).toEqual({ url: '/api/test', method: 'GET' });
  });
});
