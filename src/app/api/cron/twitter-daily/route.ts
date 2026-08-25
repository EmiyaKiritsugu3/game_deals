import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { claimDeal, loadCandidates } from '@/lib/social-cron-shared';
import { createTweet } from '@/lib/social-post';
import { handleCronError } from '../_lib/errors';

/**
 * Cron: X/Twitter daily bot (Task 3.2).
 * Best deal of the day >=50% off, once daily. 15:00 UTC (12h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const [row] = await loadCandidates(50, 1, 'x');
    if (!row) return Response.json({ ok: true, posted: 0, note: 'no candidate' });

    const release = await claimDeal('x', row.dealId);
    if (!release) return Response.json({ ok: true, posted: 0, note: 'already posted' });

    const ok = await createTweet(row);
    if (!ok) {
      await release();
      return Response.json({ ok: false, posted: 0, note: 'post failed' });
    }

    cronLog({ cron: 'twitter-daily', event: 'posted', dealId: row.dealId });
    return Response.json({ ok: true, posted: 1, dealId: row.dealId });
  } catch (err) {
    cronError({ cron: 'twitter-daily' }, err);
    return handleCronError(err);
  }
}
