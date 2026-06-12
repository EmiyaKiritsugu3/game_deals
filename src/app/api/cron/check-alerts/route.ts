import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface Alert {
  id: string;
  gameId: string;
  userId: string;
  targetPrice: number;
  currentPrice: number | null;
  storeId: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const { data: alerts, error } = await supabase.from('price_alerts').select('*');

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No alerts to check' });
    }

    const typedAlerts = alerts as unknown as Alert[];
    const uniqueGameIDs = [...new Set(typedAlerts.map((a) => a.gameId))];
    const results: Array<{ user: string; game: string; price: number }> = [];

    for (const gameID of uniqueGameIDs) {
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
      if (!res.ok) continue;
      const data = (await res.json()) as { deals: Array<{ price: string }> };

      if (!data?.deals || data.deals.length === 0) continue;

      const currentBestPrice = Number.parseFloat(data.deals[0].price);

      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ currentPrice: currentBestPrice })
        .eq('gameId', gameID);

      if (updateError) console.error(`Error updating game ${gameID}:`, updateError);

      const triggeredAlerts = typedAlerts.filter(
        (a) => a.gameId === gameID && currentBestPrice <= a.targetPrice
      );

      for (const alert of triggeredAlerts) {
        console.log(
          `🔔 ALERT TRIGGERED for User ${alert.userId}: Game ${alert.gameId} is now $${currentBestPrice} (Target: $${alert.targetPrice})`
        );
        results.push({
          user: alert.userId,
          game: alert.gameId,
          price: currentBestPrice,
        });
      }
    }

    return NextResponse.json({
      processed: uniqueGameIDs.length,
      triggered: results.length,
      details: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Alert check error:', message);
    return NextResponse.json({ error: 'Internal error checking alerts' }, { status: 500 });
  }
}
