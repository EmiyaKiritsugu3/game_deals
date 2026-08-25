import { NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { type DigestDeal, sendDigestToSubscribers } from '@/lib/digest';
import { getDeals } from '@/services/api';
import { handleCronError } from '../_lib/errors';

/**
 * Cron: top-deals weekly digest (Task 2.2).
 * Top 10 by savings% (>=50% gate), sent Sunday 23h BRT.
 * vercel.json: "0 2 * * 0" (Monday 02:00 UTC = Sunday 23h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const raw = await getDeals({ sortBy: 'Savings', onSale: '1', pageSize: '30' });

    const mapped: DigestDeal[] = raw.map((d) => ({
      title: d.title,
      salePrice: Number(d.salePrice),
      normalPrice: Number(d.normalPrice),
      savings: Number(d.savings),
      thumb: d.thumb,
      dealUrl: `${d.storeID}/${d.gameID}`,
    }));

    // Stricter weekly gate: >=50% off only.
    const gated = mapped
      .filter((d) => d.savings >= 50)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10);

    if (gated.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'No qualifying deals' });
    }

    const sent = await sendDigestToSubscribers('🔥 Top 10 promoções da semana', gated);

    cronLog({ cron: 'top-deals-digest', event: 'digest_sent', deals: gated.length, sent });

    return NextResponse.json({ ok: true, deals: gated.length, sent });
  } catch (err) {
    cronError({ cron: 'top-deals-digest' }, err);
    return handleCronError(err);
  }
}
