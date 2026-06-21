import { NextRequest } from 'next/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateServerClient } = vi.hoisted(() => ({
  mockCreateServerClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

import { updateSession } from './middleware';

function makeRequest(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

function mockSupabase(user: { id: string } | null = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  };
}

function setupSupabaseMock(user: { id: string } | null) {
  const supabase = mockSupabase(user);
  mockCreateServerClient.mockReturnValue(supabase);
  return supabase;
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('throws when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(updateSession(makeRequest('/'))).rejects.toThrow('Supabase env vars not set');
  });

  it('redirects unauthenticated user from protected path', async () => {
    setupSupabaseMock(null);
    const response = await updateSession(makeRequest('/wishlist'));
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe('http://localhost/?auth=required');
  });

  it('allows authenticated user on protected path', async () => {
    setupSupabaseMock({ id: 'u1' });
    const response = await updateSession(makeRequest('/wishlist'));
    expect(response.status).toBe(200);
  });

  it('redirects authenticated user from /auth to /profile', async () => {
    setupSupabaseMock({ id: 'u1' });
    const response = await updateSession(makeRequest('/auth'));
    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe('http://localhost/profile');
  });

  it('allows unauthenticated user on /auth', async () => {
    setupSupabaseMock(null);
    const response = await updateSession(makeRequest('/auth'));
    expect(response.status).toBe(200);
  });

  it('allows unauthenticated user on unprotected path', async () => {
    setupSupabaseMock(null);
    const response = await updateSession(makeRequest('/some-page'));
    expect(response.status).toBe(200);
  });

  it('allows authenticated user on unprotected path', async () => {
    setupSupabaseMock({ id: 'u1' });
    const response = await updateSession(makeRequest('/some-page'));
    expect(response.status).toBe(200);
  });

  it('calls setAll with cookies from the supabase client', async () => {
    const supabase = mockSupabase({ id: 'u1' });
    const request = makeRequest('/some-page');
    mockCreateServerClient.mockImplementation((_url, _key, { cookies }) => {
      cookies.setAll([{ name: 'sb-test', value: 'test-value' }]);
      return supabase;
    });
    const response = await updateSession(request);
    expect(mockCreateServerClient).toHaveBeenCalled();
    expect(response.cookies.get('sb-test')?.value).toBe('test-value');
    expect(request.cookies.get('sb-test')?.value).toBe('test-value');
  });

  it('calls getAll to read existing request cookies', async () => {
    const supabase = mockSupabase({ id: 'u1' });
    const request = makeRequest('/some-page');
    request.cookies.set('sb-access-token', 'token-abc');
    request.cookies.set('sb-refresh-token', 'refresh-xyz');

    mockCreateServerClient.mockImplementation((_url, _key, { cookies }) => {
      const result = cookies.getAll();
      expect(result).toEqual([
        { name: 'sb-access-token', value: 'token-abc' },
        { name: 'sb-refresh-token', value: 'refresh-xyz' },
      ]);
      return supabase;
    });

    const response = await updateSession(request);
    expect(response.status).toBe(200);
  });

  it('handles empty cookies in getAll', async () => {
    const supabase = mockSupabase(null);
    const request = makeRequest('/some-page');

    mockCreateServerClient.mockImplementation((_url, _key, { cookies }) => {
      const result = cookies.getAll();
      expect(result).toEqual([]);
      return supabase;
    });

    const response = await updateSession(request);
    expect(response.status).toBe(200);
  });
});

describe('isProtectedPath (boundary matching)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
  });

  const cases: Array<{ input: string; expectedProtected: boolean; label: string }> = [
    { input: '/wishlist', expectedProtected: true, label: 'exact match' },
    { input: '/wishlist/', expectedProtected: true, label: 'trailing slash' },
    { input: '/wishlist/games', expectedProtected: true, label: 'subpath' },
    { input: '/wishlistXYZ', expectedProtected: false, label: 'boundary — no false positive' },
    { input: '/Wishlist', expectedProtected: true, label: 'case insensitive' },
    { input: '/admin', expectedProtected: false, label: 'unprotected path' },
  ];

  it.each(cases)('$label: $input', async ({ input, expectedProtected }) => {
    setupSupabaseMock(null);
    const response = await updateSession(makeRequest(input));
    expect(response.status).toBe(expectedProtected ? 307 : 200);
  });
});
