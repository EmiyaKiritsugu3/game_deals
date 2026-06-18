import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { checkTriggeredAlertsAction } from '@/actions/alerts';
import { verifyCronAuth } from '@/lib/cron-auth';
import { CronError, handleCronError } from '../_lib/errors';

async function executeCheckAlerts(): Promise<NextResponse> {
  const { checked, triggered } = await Promise.race([
    checkTriggeredAlertsAction(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new CronError('TIMEOUT', 'check-alerts timed out after 290s')),
        290_000
      )
    ),
  ]);

  for (const a of triggered) {
    console.log(
      `ALERT TRIGGERED user=${a.userId} game=${a.gameId} price=${a.currentLowest} target=${a.targetPrice}`
    );
  }

  return NextResponse.json({
    processed: checked,
    triggered: triggered.length,
    details: triggered,
  });
}

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    return await executeCheckAlerts();
  } catch (err) {
    console.error('check-alerts error:', err instanceof Error ? err.message : err);
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    return handleCronError(err);
  }
}
