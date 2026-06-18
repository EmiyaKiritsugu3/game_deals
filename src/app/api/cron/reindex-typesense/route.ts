import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { syncGamesToTypesenseAction } from '@/actions/search';
import { verifyCronAuth } from '@/lib/cron-auth';
import { CronError, handleCronError } from '../_lib/errors';

/**
 * Vercel Cron Job — daily reindex Typesense
 * GET /api/cron/reindex-typesense
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  console.log('[Cron] Starting Typesense reindex...');

  try {
    const result = await Promise.race([
      syncGamesToTypesenseAction(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new CronError('TIMEOUT', 'reindex-typesense timed out after 300s')),
          300_000
        )
      ),
    ]);

    if (result.success) {
      console.log(`[Cron] Success: ${result.indexed} games indexed`);
    } else {
      console.error(`[Cron] reindex-typesense failed: ${result.error}`);
      Sentry.captureException(new Error(`[Cron] reindex-typesense failed: ${result.error}`));
    }

    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error('reindex-typesense error:', err instanceof Error ? err.message : err);
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    return handleCronError(err);
  }
}
