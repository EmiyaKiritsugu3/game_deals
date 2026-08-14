'use server';

import { sql } from 'drizzle-orm';
import { resolveCheapsharkByUuidsAction } from '@/actions/deals';
import { db } from '@/db';
import { assertRateLimit } from '@/lib/server-action-rate-limit';
import { createClient } from '@/utils/supabase/server';

export async function getUserWishlistAction(): Promise<string[]> {
  await assertRateLimit('wishlistFetch', null, 30, 60_000);
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const rows = await db.execute<{ gameId: string }>(
    sql`SELECT "gameId" FROM wishlists WHERE "userId" = ${user.id}::uuid`
  );

  if (rows.length === 0) {
    return [];
  }

  const uuids = rows.map((row) => row.gameId);
  const cheapsharkMap = await resolveCheapsharkByUuidsAction(uuids);

  return uuids
    .map((uuid: string) => cheapsharkMap[uuid])
    .filter((id: string | undefined): id is string => id != null);
}
