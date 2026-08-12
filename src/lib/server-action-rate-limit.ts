import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Enforce per-user (authed) or per-IP (anon) rate limit on a server action.
 * Mutating actions get tighter defaults than reads.
 * ponytail: single helper, no config object — two params cover the matrix.
 */
export async function assertRateLimit(
  action: string,
  userId?: string | null,
  maxAttempts = 10,
  windowMs = 60_000
): Promise<void> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = userId ? `${action}:u:${userId}` : `${action}:ip:${ip}`;
  const allowed = await rateLimit(key, maxAttempts, windowMs);
  if (!allowed) throw new Error('Rate limit exceeded');
}
