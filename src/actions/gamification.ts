'use server';

import { db } from '@/db';
import { userStats } from '@/db/schema';
import { createClient } from '@/utils/supabase/server';

export async function updateLeaderboardOptIn(optIn: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await db
    .insert(userStats)
    .values({ userId: user.id, xp: 0, optInLeaderboard: optIn })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: { optInLeaderboard: optIn },
    });
}

export async function updateLeaderboardOptInAction(_prev: unknown, formData: FormData) {
  await updateLeaderboardOptIn(formData.get('optIn') === 'on');
  return { success: true };
}
