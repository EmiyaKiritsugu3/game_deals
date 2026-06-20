import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateServerClient, mockGetAll, mockSet } = vi.hoisted(() => ({
  mockCreateServerClient: vi.fn(),
  mockGetAll: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: mockGetAll,
    set: mockSet,
  }),
}));

import { createClient } from './server';

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
    mockCreateServerClient.mockReturnValue({ auth: {} });
  });

  it('creates a server client with correct env vars', async () => {
    await createClient();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(createClient()).rejects.toThrow('Supabase env vars not set');
  });

  it('throws when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    await expect(createClient()).rejects.toThrow('Supabase env vars not set');
  });

  it('getAll returns cookies from cookie store', async () => {
    mockGetAll.mockReturnValueOnce([{ name: 'sb-token', value: 'abc' }]);

    await createClient();
    const cookiesAdapter = mockCreateServerClient.mock.calls[0][2].cookies;
    const result = cookiesAdapter.getAll();

    expect(result).toEqual([{ name: 'sb-token', value: 'abc' }]);
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('setAll applies cookies to cookie store', async () => {
    await createClient();
    const cookiesAdapter = mockCreateServerClient.mock.calls[0][2].cookies;

    cookiesAdapter.setAll([
      { name: 'sb-access', value: 'token-1', options: { httpOnly: true } },
      { name: 'sb-refresh', value: 'token-2', options: { path: '/' } },
    ]);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('sb-access', 'token-1', { httpOnly: true });
    expect(mockSet).toHaveBeenCalledWith('sb-refresh', 'token-2', { path: '/' });
  });

  it('setAll swallows errors from cookie store (Server Component context)', async () => {
    mockSet.mockImplementation(() => {
      throw new Error('Cookie set error: Cannot set headers after they are sent');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await createClient();
    const cookiesAdapter = mockCreateServerClient.mock.calls[0][2].cookies;

    expect(() => cookiesAdapter.setAll([{ name: 'sb-token', value: 'val' }])).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
