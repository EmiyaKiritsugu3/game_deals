import { sql } from 'drizzle-orm';
import { db } from '@/db';

/**
 * GET /api/health — uptime probe (BetterStack/Vercel monitors).
 * DB ok → 200 even if external deps degrade. DB down → 503.
 */

async function checkUrl(url: string, init?: RequestInit): Promise<boolean> {
  try {
    const res = await fetch(url, init);
    return res.ok;
  } catch {
    return false;
  }
}

function typesenseUrl(): string {
  const host = process.env.TYPESENSE_HOST || 'localhost';
  const port = Number.parseInt(process.env.TYPESENSE_PORT || '443', 10);
  const protocol = process.env.TYPESENSE_PROTOCOL || 'https';
  return `${protocol}://${host}:${port}/health`;
}

export async function GET(): Promise<Response> {
  const dbCheck = db.execute(sql`SELECT 1`).then(
    () => true,
    () => false
  );

  const [dbOk, cheapOk, typesOk] = await Promise.all([
    dbCheck,
    checkUrl('https://www.cheapshark.com/api/1.0/deals?pageSize=1', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    }),
    checkUrl(typesenseUrl(), { signal: AbortSignal.timeout(3000) }),
  ]);

  const allOk = dbOk && cheapOk && typesOk;
  const body = {
    status: dbOk ? (allOk ? 'ok' : 'degraded') : 'degraded',
    db: dbOk ? 'ok' : 'error',
    cheapshark: cheapOk ? 'ok' : 'error',
    typesense: typesOk ? 'ok' : 'error',
    ts: new Date().toISOString(),
  };

  return Response.json(body, { status: dbOk ? 200 : 503 });
}
