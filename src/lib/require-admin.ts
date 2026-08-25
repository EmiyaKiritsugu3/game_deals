import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema/users';
import { ForbiddenError, requireUser } from './require-user';

export type AdminUser = Awaited<ReturnType<typeof requireAdmin>>;

/**
 * Require authenticated user with role === 'admin'.
 * Throws UnauthorizedError if no session, ForbiddenError if not admin.
 *
 * Ponytail: cheap query — single index hit on profiles.id (PK). No caching layer
 * until admin check shows up in hot path.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return { ...user, role: 'admin' as const };
}
