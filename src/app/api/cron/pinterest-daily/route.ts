import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { claimDeal, loadCandidates } from '@/lib/social-cron-shared';
import { createPinterestPin } from '@/lib/social-post';
import { handleCronError } from '../_lib/errors';

/**
 * Cron: Pinterest daily auto-pin (Task 3.1).
 * Top 20 deals >=30% off not yet pinned. Daily 13:00 UTC (10h BRT).
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const rows = await loadCandidates(30, 20, 'pinterest');
    let posted = 0;

    for (const row of rows) {
      const release = await claimDeal('pinterest', row.dealId);
      if (!release) continue;

      const ok = await createPinterestPin({
        dealId: row.dealId,
        title: row.title,
        salePrice: row.salePrice,
        normalPrice: row.normalPrice,
        savings: row.savings,
        thumb: row.thumb,
      });
      if (!ok) {
        await release();
      } else {
        posted++;
      }
    }

    cronLog({ cron: 'pinterest-daily', event: 'posted', count: posted });
    return Response.json({ ok: true, posted, candidates: rows.length });
  } catch (err) {
    cronError({ cron: 'pinterest-daily' }, err);
    return handleCronError(err);
  }
}
