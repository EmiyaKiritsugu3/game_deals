import { sql } from 'drizzle-orm';
import { db } from '@/db';

// Periodic cleanup prevents table bloat — runs at most once per minute across all instances
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60_000;

async function cleanup(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 hour'`);
}

export async function rateLimit(key: string, maxAttempts = 10, windowMs = 60000): Promise<boolean> {
  // Fire-and-forget cleanup to avoid blocking the critical path
  cleanup().catch(() => {
    /* non-critical */
  });

  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));

  // Use a transaction to ensure the advisory lock protects the upsert atomically
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
