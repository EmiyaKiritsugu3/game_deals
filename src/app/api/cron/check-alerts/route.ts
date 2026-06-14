import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';

interface TriggeredAlert {
  alert_id: string;
  user_id: string;
  game_id: string;
  store_id: string | null;
  target_price: number;
  current_price: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const triggered = (await db.execute(
      sql`SELECT * FROM public.check_alerts_for_all()`
    )) as unknown as TriggeredAlert[];

    for (const a of triggered) {
      console.log(
        `ALERT TRIGGERED user=${a.user_id} game=${a.game_id} price=${a.current_price} target=${a.target_price}`
      );
    }

    return NextResponse.json({
      processed: triggered.length,
      triggered: triggered.length,
      details: triggered,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('check-alerts error:', message);
    return NextResponse.json({ error: 'Internal error checking alerts' }, { status: 500 });
  }
}
