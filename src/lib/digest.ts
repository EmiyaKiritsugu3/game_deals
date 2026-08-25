import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { sendEmail } from './resend';

/**
 * Shared digest sender for newsletter crons (Tasks 2.1/2.2).
 * Loads active subscribers and sends the same HTML to each, chunked.
 */

export interface DigestDeal {
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
  dealUrl: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';
const CHUNK_SIZE = 50;
const BATCH_DELAY_MS = 1_000;

function money(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export function digestHtml(deals: DigestDeal[], heading: string): string {
  const items = deals
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 0">
          <table role="presentation" width="100%" style="background:#1e293b;border-radius:8px;padding:12px">
            <tr>
              <td width="80" valign="top"><img src="${d.thumb}" width="80" alt="" /></td>
              <td valign="top" style="padding-left:12px">
                <a href="${SITE_URL}/out/${encodeURIComponent(d.dealUrl)}" style="color:#22d3ee;font-weight:600;text-decoration:none">${d.title}</a><br />
                <span style="color:#94a3b8;text-decoration:line-through">${money(d.normalPrice)}</span>
                <span style="color:#f1f5f9;font-weight:700"> ${money(d.salePrice)}</span>
                <span style="color:#4ade80;font-weight:700"> (-${Math.round(d.savings)}%)</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#0f172a;font-family:system-ui,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#0f172a;color:#cbd5e1;font-size:14px">
<tr><td style="font-size:20px;font-weight:700;color:#f1f5f9;padding-bottom:16px">${heading}</td></tr>
${items}
<tr><td style="padding-top:16px;font-size:12px;color:#64748b">
Enviado porque você assinou a newsletter do GameDeals ·
<a href="${SITE_URL}" style="color:#64748b">gamedeals.com.br</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/**
 * Send digest HTML to all active subscribers in chunks of CHUNK_SIZE with delay
 * between batches (Resend rate limits). Returns count of successful sends.
 */
export async function sendDigestToSubscribers(
  heading: string,
  deals: DigestDeal[]
): Promise<number> {
  const subs = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'active'));

  if (subs.length === 0) return 0;

  const html = digestHtml(deals, heading);
  let sent = 0;

  for (let i = 0; i < subs.length; i += CHUNK_SIZE) {
    const batch = subs.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      batch.map((s) =>
        sendEmail({
          to: s.email,
          subject: `${heading} | GameDeals`,
          html,
        })
      )
    );
    sent += results.filter((r) => r.status === 'fulfilled').length;
    if (i + CHUNK_SIZE < subs.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  return sent;
}

/**
 * Quality gate: only send deals with meaningful savings and a usable link.
 */
export function qualityGate(deals: DigestDeal[]): DigestDeal[] {
  return deals.filter((d) => d.savings >= 30 && d.dealUrl.length > 0);
}
