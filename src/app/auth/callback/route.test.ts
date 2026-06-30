import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/auth/callback');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('GET /auth/callback — safeNext validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /profile on valid next param', async () => {
    const res = await GET(makeRequest({ code: 'test-code', next: '/profile' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/profile');
  });

  it('rejects protocol-relative URL (//evil.com) — defaults to /', async () => {
    const res = await GET(makeRequest({ code: 'test-code', next: '//evil.com' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('rejects backslash evasion (/\\evil.com) — defaults to /', async () => {
    const res = await GET(makeRequest({ code: 'test-code', next: '/\\evil.com' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('defaults to / when next is null', async () => {
    const res = await GET(makeRequest({ code: 'test-code' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('rejects javascript: scheme — defaults to /', async () => {
    const res = await GET(makeRequest({ code: 'test-code', next: 'javascript:alert(1)' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('rejects nested path with double slash — defaults to /', async () => {
    const res = await GET(makeRequest({ code: 'test-code', next: '//evil.com/path' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });
});
