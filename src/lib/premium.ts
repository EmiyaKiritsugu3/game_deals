import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { getOptionalUser } from '@/lib/require-user';

/**
 * Server-side premium check. Returns true only for logged-in users with
 * premiumUntil in the future. Safe to call from any Server Component.
 */
export async function isPremium(): Promise<boolean> {
  const user = await getOptionalUser();
  if (!user) return false;

  const [profile] = await db
    .select({ premiumUntil: profiles.premiumUntil })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return !!profile?.premiumUntil && profile.premiumUntil.getTime() > Date.now();
}
