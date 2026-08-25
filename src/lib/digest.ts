import { setTimeout as sleep } from 'node:timers/promises';
import { sendEmail } from './resend';

export interface DigestDeal {
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
  dealUrl: string;
}

// ponytail: dynamic import keeps digestHtml testable without DATABASE_URL at module load.
async function getSubscribers(): Promise<string[]> {
  const [{ eq }, { db }, { newsletterSubscribers }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const subs = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'active'));
  return subs.map((s) => s.email);
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';
const CHUNK_SIZE = 50;
const BATCH_DELAY_MS = 1_000;

function money(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

/** Escape untrusted strings (deal titles/thumbs come from CheapShark) for safe HTML interpolation. */
function esc(s: string): string {
  return s
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('"')
    .join('&quot;')
    .split("'")
    .join('&#39;');
}

export function digestHtml(deals: DigestDeal[], heading: string): string {
  const safeHeading = esc(heading);
  const items = deals
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 0">
          <table role="presentation" width="100%" style="background:#1e293b;border-radius:8px;padding:12px">
            <tr>
              <td width="80" valign="top"><img src="${esc(d.thumb)}" width="80" alt="" /></td>
              <td valign="top" style="padding-left:12px">
                <a href="${SITE_URL}/out/${encodeURIComponent(d.dealUrl)}" style="color:#22d3ee;font-weight:600;text-decoration:none">${esc(d.title)}</a><br />
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
<tr><td style="font-size:20px;font-weight:700;color:#f1f5f9;padding-bottom:16px">${safeHeading}</td></tr>
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
  const emails = await getSubscribers();

  if (emails.length === 0) return 0;

  const html = digestHtml(deals, heading);
  let sent = 0;

  for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
    const batch = emails.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      batch.map((email) =>
        sendEmail({
          to: email,
          subject: `${heading} | GameDeals`,
          html,
        })
      )
    );
    sent += results.filter((r) => r.status === 'fulfilled').length;
    if (i + CHUNK_SIZE < emails.length) {
      await sleep(BATCH_DELAY_MS);
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
