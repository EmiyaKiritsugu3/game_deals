import { sql } from 'drizzle-orm';
import { db } from '@/db';

/**
 * GET /api/health — uptime probe (BetterStack/Vercel monitors).
 * Returns 200 with component status; DB failure degrades to 503.
 */
export async function GET(): Promise<Response> {
  let dbOk = true;
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbOk = false;
  }

  const body = {
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'ok' : 'error',
    ts: new Date().toISOString(),
  };

  return Response.json(body, { status: dbOk ? 200 : 503 });
}
