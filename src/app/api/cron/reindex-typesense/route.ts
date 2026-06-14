import { NextResponse } from 'next/server';
import { syncGamesToTypesenseAction } from '@/actions/search';
import { verifyCronAuth } from '@/lib/cron-auth';

/**
 * Verval Cron Job — daily reindex Typesense
 * GET /api/cron/reindex-typesense
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  console.log('[Cron] Starting Typesense reindex...');

  const result = await syncGamesToTypesenseAction();

  if (result.success) {
    console.log(`[Cron] Success: ${result.indexed} games indexed`);
  } else {
    console.error(`[Cron] Failed: ${result.error}`);
  }

  const status = result.success ? 200 : 500;
  return NextResponse.json(result, { status });
}
