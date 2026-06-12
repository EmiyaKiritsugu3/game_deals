import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // biome-ignore lint/suspicious/useIterableCallbackReturn: forEach side-effect only
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (e) {
          // Middleware já possui cookie access
          console.error('Cookie set error:', e);
        }
      },
    },
  });
}
