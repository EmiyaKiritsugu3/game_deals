import { afterAll, beforeEach, describe, expect, it } from 'vitest';

describe('createClient', () => {
  const OLD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const OLD_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = OLD_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = OLD_KEY;
  });

  it('returns a client when both env vars are set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
    const { createClient } = await import('./client');
    const client = createClient();
    expect(client).toBeDefined();
    expect(typeof client.auth).toBe('object');
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
    const { createClient } = await import('./client');
    expect(() => createClient()).toThrow('Supabase env vars not set');
  });

  it('throws when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    const { createClient } = await import('./client');
    expect(() => createClient()).toThrow('Supabase env vars not set');
  });
});
