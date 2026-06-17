import { createClient } from '@/utils/supabase/client';

let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  browserClient ??= createClient();
  return browserClient;
}
