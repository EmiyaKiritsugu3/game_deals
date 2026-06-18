import type { SupabaseClient } from '@supabase/supabase-js';

export function createMockSupabaseClient(): {
  auth: Pick<SupabaseClient['auth'], 'getSession' | 'signOut'>;
  from: SupabaseClient['from'];
} {
  const mockQuery = {
    eq: () => Promise.resolve({ data: [], error: null }),
  } as unknown as ReturnType<ReturnType<SupabaseClient['from']>['select']>;

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () =>
      ({
        select: () => mockQuery,
      }) as unknown as ReturnType<SupabaseClient['from']>,
  };
}
