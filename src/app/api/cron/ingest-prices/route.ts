import { NextResponse } from 'next/server';
import { ingestPricesAction } from '@/actions/deals';
import { verifyCronAuth } from '@/lib/cron-auth';
import { CronError, handleCronError } from '../_lib/errors';

/**
 * Vercel Cron Job — runs every 4h
 * GET /api/cron/ingest-prices
 * Auth: Bearer token via CRON_SECRET
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  console.log('[Cron] Starting price ingestion...');

  try {
    const result = await Promise.race([
      ingestPricesAction(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new CronError('TIMEOUT', 'ingest-prices timed out after 240s')),
          240_000
        )
      ),
    ]);

    if (result.success) {
      console.log(`[Cron] Success: ${result.dealsIngested} deals, ${result.gamesUpserted} games`);
    } else {
      console.error(`[Cron] Failed: ${result.error}`);
    }

    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error('ingest-prices error:', err instanceof Error ? err.message : err);
    return handleCronError(err);
  }
}
