'use server';

import { resolveCheapsharkByUuidsAction } from '@/actions/deals';
import { getBrowserClient } from '@/lib/supabase-browser';

export async function getUserWishlistAction(): Promise<string[]> {
  const supabase = getBrowserClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return [];
  }

  const { data, error } = await supabase.from('wishlists').select('gameId');

  if (error || !data || data.length === 0) {
    return [];
  }

  const uuids = data.map((row: { gameId: string }) => row.gameId);
  const cheapsharkMap = await resolveCheapsharkByUuidsAction(uuids);

  return uuids
    .map((uuid: string) => cheapsharkMap[uuid])
    .filter((id: string | undefined): id is string => id != null);
}
