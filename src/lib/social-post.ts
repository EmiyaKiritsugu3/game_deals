/**
 * Social posting clients (Tasks 3.1/3.2) - raw fetch, zero deps.
 * Env: PINTEREST_TOKEN + PINTEREST_BOARD_ID, X_BEARER_TOKEN.
 * ponytail: official SDKs heavy; API surfaces used are 2 POSTs each.
 */

import { formatUSD, SITE_URL } from './site';

const TIMEOUT_MS = 10_000;

export interface SocialDeal {
  dealId: string;
  title: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  thumb: string;
}

async function postJson(
  url: string,
  body: unknown,
  token?: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Create a Pin from the deal OG image. Best-effort. */
export async function createPinterestPin(deal: SocialDeal): Promise<boolean> {
  const token = process.env.PINTEREST_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId) return false;

  const res = await postJson(
    'https://api.pinterest.com/v5/pins',
    {
      board_id: boardId,
      title: `${deal.title} - ${Math.round(deal.savings)}% OFF | GameDeals`,
      description: `From ${formatUSD(deal.normalPrice)} for ${formatUSD(deal.salePrice)} on GameDeals`,
      link: `${SITE_URL}/game/${deal.dealId}`,
      media_source: { source_type: 'image_url', url: `${SITE_URL}/og.png/${deal.dealId}` },
    },
    token
  );
  return res.ok;
}

/** Post one tweet with the deal link. Best-effort. X free tier is text-only. */
export async function createTweet(deal: SocialDeal): Promise<boolean> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return false;

  const text =
    `🔥 ${deal.title} is ${Math.round(deal.savings)}% OFF! ` +
    `From ${formatUSD(deal.normalPrice)} for ${formatUSD(deal.salePrice)}\n` +
    `${SITE_URL}/game/${deal.dealId}`;
  const truncated = text.length > 280 ? `${text.slice(0, 277)}...` : text;

  const res = await postJson('https://api.twitter.com/2/tweets', { text: truncated }, token);
  return res.ok;
}
