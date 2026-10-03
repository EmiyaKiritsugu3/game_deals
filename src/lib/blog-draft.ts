import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Deal } from '@/types/game';
import { getPost, parsePost } from './blog';
import { formatUSD } from './site';

export const DRAFT_MIN_WORDS = 600;
export const DRAFT_MIN_DEALS = 3;
export const DRAFT_MAX_DEALS = 8;

export interface DraftDeal {
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  store: string;
  gameID: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function usd(n: number): string {
  return formatUSD(n);
}

/** CheapShark deal → draft deal, salePrice===0 only (caller filters). */
export function toDraftDeals(raw: Deal[], stores: Record<string, string>): DraftDeal[] {
  return raw
    .filter((d) => Number(d.salePrice) === 0)
    .map((d) => ({
      title: d.title,
      salePrice: 0,
      normalPrice: Number(d.normalPrice),
      savings: Math.round(Number(d.savings)),
      store: stores[d.storeID] ?? `Store ${d.storeID}`,
      gameID: d.gameID,
    }));
}

export function draftSlug(now: Date): string {
  return `free-games-of-the-week-${now.toISOString().slice(0, 10)}`;
}

/** First free slug: base, base-2, base-3… (getPost returns null when missing). */
export async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await getPost(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function dealSection(d: DraftDeal): string {
  return [
    `## ${d.title}`,
    '',
    `${d.title} is free to claim right now: from ${usd(d.normalPrice)} down to $0.00 ` +
      `(${d.savings}% off) on ${d.store}. These offers disappear fast — ` +
      `the claim window usually lasts just a few days, and once it closes the price goes back to normal. ` +
      `If the game was already on your wishlist, this is the best possible time to grab your copy.`,
    '',
    `To claim it, open the game page, hit redeem and check that it showed up ` +
      `in your library before closing the tab. Worth doing even if you don't plan to play right now: ` +
      `once redeemed, the game is yours forever. If the redeem button doesn't show up at first, ` +
      `reload the page or try an incognito tab — stores usually require login to release the claim.`,
    '',
  ].join('\n');
}

export function buildDraftMarkdown(deals: DraftDeal[], now: Date): string {
  const iso = now.toISOString().slice(0, 10);
  const us = iso.split('-').join('/');
  const front = [
    '---',
    `title: Free games of the week — ${us}`,
    `description: ${deals.length} free games to claim this week across major PC stores. Limited-time offer.`,
    `date: ${iso}`,
    'published: false',
    `dealIds: ${deals.map((d) => d.gameID).join(', ')}`,
    '---',
    '',
  ].join('\n');
  const intro = [
    'Every week PC stores release free games for a limited time, and this roundup collects ' +
      `the highlights worth your click. All prices were verified at publishing time — ` +
      `claim as soon as possible, because once the window closes the price goes back to normal. ` +
      `The list below has ${deals.length} free games this week, each with a direct link to the claim page.`,
    '',
  ].join('\n');
  const howto = [
    '## How to redeem',
    '',
    'The process is the same on virtually every store: open the game page from the roundup link, ' +
      `log in to your account and click the redeem button (or buy at zero price). Check that the game ` +
      `showed up in your library before closing the tab — sometimes the order sits as ` +
      `pending for a few minutes before clearing. If a game on the list is back to full price by the time you arrive, ` +
      `don't give up: stores refresh the free offers every week and the next roundup is already on its way. ` +
      `Also check for free DLCs or packs on the same page, which often go unnoticed.`,
    '',
  ].join('\n');
  const outro = [
    '## Final tip',
    '',
    'Turn on GameDeals price alerts for the paid games on your wishlist: that way you ' +
      `get notified when they go on sale. And come back every Monday — this roundup is updated ` +
      `automatically with the new free games of the week.`,
    '',
  ].join('\n');
  return front + intro + deals.map(dealSection).join('\n') + howto + outro;
}

/** Word count of the post body (frontmatter excluded via parsePost). */
export function bodyWords(markdown: string): number {
  const post = parsePost('draft', markdown);
  if (!post) return 0;
  return post.body.split(/\s+/).filter(Boolean).length;
}

export async function saveDraft(slug: string, markdown: string): Promise<void> {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.writeFile(path.join(BLOG_DIR, `${slug}.md`), markdown, 'utf8');
}
