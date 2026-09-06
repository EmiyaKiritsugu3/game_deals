import { NextResponse } from 'next/server';
import {
  bodyWords,
  buildDraftMarkdown,
  DRAFT_MAX_DEALS,
  DRAFT_MIN_DEALS,
  DRAFT_MIN_WORDS,
  draftSlug,
  saveDraft,
  toDraftDeals,
  uniqueSlug,
} from '@/lib/blog-draft';
import { verifyCronAuth } from '@/lib/cron-auth';
import { cronError, cronLog } from '@/lib/cron-log';
import { getDeals, getStores } from '@/services/api';
import { handleCronError } from '../_lib/errors';

/**
 * Cron: weekly blog draft (T8).
 * Grabs free (price=0) deals, builds a T7-format markdown draft with
 * published:false, saves to content/blog/. Human publishes by flipping flag.
 * Monday 13:00 UTC = 10h BRT.
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const [raw, stores] = await Promise.all([
      getDeals({ sortBy: 'Savings', upperPrice: '0', pageSize: '20' }),
      getStores(),
    ]);
    const deals = toDraftDeals(raw, stores).slice(0, DRAFT_MAX_DEALS);

    // Quality gate inline: ≥3 verified free deals.
    if (deals.length < DRAFT_MIN_DEALS) {
      return NextResponse.json({
        ok: true,
        saved: null,
        note: `Only ${deals.length} free deals, need ${DRAFT_MIN_DEALS} — draft skipped`,
      });
    }

    const now = new Date();
    const markdown = buildDraftMarkdown(deals, now);

    // Quality gate inline: ≥600 body words (frontmatter excluded).
    const words = bodyWords(markdown);
    if (words < DRAFT_MIN_WORDS) {
      return NextResponse.json({
        ok: true,
        saved: null,
        note: `Draft has ${words} words, need ${DRAFT_MIN_WORDS} — draft skipped`,
      });
    }

    // Quality gate inline: unique slug (base, base-2, …).
    const slug = await uniqueSlug(draftSlug(now));
    await saveDraft(slug, markdown);

    cronLog({ cron: 'weekly-blog-post', event: 'draft_saved', slug, deals: deals.length, words });

    return NextResponse.json({ ok: true, slug, deals: deals.length, words });
  } catch (err) {
    cronError({ cron: 'weekly-blog-post' }, err);
    return handleCronError(err);
  }
}
