import { NextResponse } from 'next/server';
import { syncGamesToTypesenseAction } from '@/actions/search';

/**
 * Vercel Cron Job — daily reindex Typesense
 * GET /api/cron/reindex-typesense
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
