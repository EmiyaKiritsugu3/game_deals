import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

// --- Upstash client (lazy singleton) ---

let ratelimitInstance: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  ratelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: false,
    prefix: 'gamedeals:rl',
  });
  return ratelimitInstance;
}

// --- PostgreSQL fallback (original implementation) ---

let lastCleanup = 0;
const CLEANUP_INTERVAL = 60_000;

async function cleanup(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 hour'`);
}

async function rateLimitPostgres(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<boolean> {
  cleanup().catch(() => {
    /* non-critical */
  });

  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));

  const rows = await db.transaction(async (tx) => {
    const lockKey = sql`('x' || substr(md5('rl:' || ${key}), 1, 16))::bit(64)::bigint`;
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

    return tx.execute(sql`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (
        ${key},
        1,
        now() + make_interval(secs => ${windowSeconds})
      )
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.reset_at < now() THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at < now()
          THEN now() + make_interval(secs => ${windowSeconds})
          ELSE rate_limits.reset_at
        END
      RETURNING count, reset_at
    `);
  });

  if (rows.length === 0) return true;
  const row = rows[0] as { count: number };
  return row.count <= maxAttempts;
}

// --- Public API ---

export async function rateLimit(key: string, maxAttempts = 10, windowMs = 60000): Promise<boolean> {
  const rl = getRatelimit();
  if (rl) {
    try {
      const result = await rl.limit(key);
      return result.success;
    } catch {
      // Upstash unavailable — fall through to PostgreSQL
    }
  }
  return rateLimitPostgres(key, maxAttempts, windowMs);
}
