import { NextResponse } from 'next/server';
import { ingestPricesAction } from '@/actions/deals';

/**
 * Vercel Cron Job — roda a cada 4h
 * GET /api/cron/ingest-prices
 * Auth: Bearer token via CRON_SECRET
 */
export async function GET(request: Request) {
  // Verificar auth
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting price ingestion...');

  const result = await ingestPricesAction();

  if (result.success) {
    console.log(`[Cron] Success: ${result.dealsIngested} deals, ${result.gamesUpserted} games`);
  } else {
    console.error(`[Cron] Failed: ${result.error}`);
  }

  const status = result.success ? 200 : 500;
  return NextResponse.json(result, { status });
}
