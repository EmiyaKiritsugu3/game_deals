import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { postDiscordEmbed } from '@/lib/discord-webhook';
import { claimDeal, loadCandidates } from '@/lib/social-cron-shared';
import { handleCronError } from '../_lib/errors';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';

/**
 * Cron: Discord flash-deal posts (Task 4.1).
 * Top 3 deals >=70% off, deduped via social_posts table.
 * vercel.json schedule: every-15-minutes.
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const rows = await loadCandidates(70, 3, 'discord');
    let posted = 0;

    for (const row of rows) {
      const release = await claimDeal('discord', row.dealId);
      if (!release) continue; // lost race / already posted

      const ok = await postDiscordEmbed({
        title: `🔥 ${row.title} — ${Math.round(row.savings)}% OFF`,
        url: `${SITE_URL}/game/${row.dealId}`,
        description: `De R$ ${row.normalPrice.toFixed(2)} por R$ ${row.salePrice.toFixed(2)}`,
        color: 0x22d3ee,
        image: row.thumb ? { url: row.thumb } : undefined,
      });

      if (!ok) {
        await release(); // allow retry next run
      } else {
        posted++;
      }
    }

    cronLog({ cron: 'discord-flash-deals', event: 'posted', count: posted });
    return Response.json({ ok: true, posted, candidates: rows.length });
  } catch (err) {
    cronError({ cron: 'discord-flash-deals' }, err);
    return handleCronError(err);
  }
}
