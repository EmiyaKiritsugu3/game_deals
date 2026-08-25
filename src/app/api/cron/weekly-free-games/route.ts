import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { type DigestDeal, qualityGate, sendDigestToSubscribers } from '@/lib/digest';
import { getDeals } from '@/services/api';
import { handleCronError } from '../_lib/errors';

/**
 * Cron: weekly free-games digest (Task 2.1).
 * Pulls free (price=0) deals from CheapShark, quality-gates, sends to newsletter.
 * vercel.json: "0 12 * * 1" (Monday 12:00 UTC = 09h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const raw = await getDeals({ sortBy: 'Savings', upperPrice: '0', pageSize: '20' });

    const mapped: DigestDeal[] = raw
      .filter((d) => Number(d.salePrice) === 0)
      .map((d) => ({
        title: d.title,
        salePrice: Number(d.salePrice),
        normalPrice: Number(d.normalPrice),
        savings: Number(d.savings),
        thumb: d.thumb,
        dealUrl: `${d.storeID}/${d.gameID}`,
      }));

    const gated = qualityGate(mapped).slice(0, 10);

    if (gated.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'No qualifying free games this week' });
    }

    const sent = await sendDigestToSubscribers('🆓 Jogos grátis da semana', gated);

    cronLog({ cron: 'weekly-free-games', event: 'digest_sent', deals: gated.length, sent });

    return NextResponse.json({ ok: true, deals: gated.length, sent });
  } catch (err) {
    cronError({ cron: 'weekly-free-games' }, err);
    return handleCronError(err);
  }
}
