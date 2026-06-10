import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();

  try {
    // 2. Fetch all active alerts
    const { data: alerts, error } = await supabase.from('price_alerts').select('*');

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No alerts to check' });
    }

    // 3. Group by game_id to avoid redundant API calls
    const uniqueGameIDs = [...new Set(alerts.map((a: any) => a.game_id))];
    const results = [];

    for (const gameID of uniqueGameIDs) {
      // 4. Fetch real-time price from CheapShark
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
      const data = await res.json();

      if (!data?.deals || data.deals.length === 0) continue;

      const currentBestPrice = parseFloat(data.deals[0].price);

      // 5. Update all matching alerts in the DB
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ current_price: currentBestPrice })
        .eq('game_id', gameID);

      if (updateError) console.error(`Error updating game ${gameID}:`, updateError);

      // 6. Identify users who should be notified
      const triggeredAlerts = alerts.filter(
        (a: any) => a.game_id === gameID && currentBestPrice <= a.target_price
      );

      for (const alert of triggeredAlerts) {
        // In a real app, this is where we call Resend/SendGrid/Twilio
        console.log(
          `🔔 ALERT TRIGGERED for User ${alert.user_id}: ${alert.game_title} is now $${currentBestPrice} (Target: $${alert.target_price})`
        );
        results.push({
          user: alert.user_id,
          game: alert.game_title,
          price: currentBestPrice,
        });
      }
    }

    return NextResponse.json({
      processed: uniqueGameIDs.length,
      triggered: results.length,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
