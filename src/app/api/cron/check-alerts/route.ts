import { NextResponse } from 'next/server';
import { checkTriggeredAlertsAction } from '@/actions/alerts';

// fallow-ignore-next-line complexity
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { checked, triggered } = await checkTriggeredAlertsAction();

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('check-alerts error:', message);
    return NextResponse.json({ error: 'Internal error checking alerts' }, { status: 500 });
  }
}
