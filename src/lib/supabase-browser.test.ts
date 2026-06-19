import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBrowserClient = { auth: { onAuthStateChange: vi.fn() } };
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(() => mockBrowserClient),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: mockCreateClient,
}));

describe('getBrowserClient', () => {
  const OLD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const OLD_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
    mockCreateClient.mockReturnValue(mockBrowserClient);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = OLD_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = OLD_KEY;
  });

  it('creates a client on first call', async () => {
    const { getBrowserClient } = await import('./supabase-browser');
    const client = getBrowserClient();
    expect(client).toBe(mockBrowserClient);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it('returns the SAME instance on second call (singleton)', async () => {
    const { getBrowserClient } = await import('./supabase-browser');
    const first = getBrowserClient();
    const second = getBrowserClient();
    expect(first).toBe(second);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it('propagates error when createClient throws', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    mockCreateClient.mockImplementation(() => {
      throw new Error('Supabase env vars not set');
    });
    const { getBrowserClient } = await import('./supabase-browser');
    expect(() => getBrowserClient()).toThrow('Supabase env vars not set');
  });
});
