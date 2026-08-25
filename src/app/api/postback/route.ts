import * as Sentry from '@sentry/nextjs';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyPostbackAuth } from '@/lib/postback-auth';

const VALID_STATUSES = new Set(['pending', 'approved', 'reversed', 'paid']);

interface PostbackPayload {
  order_id?: unknown;
  store_id?: unknown;
  game_slug?: unknown;
  click_id?: unknown;
  commission_cents?: unknown;
  currency?: unknown;
  status?: unknown;
}

/**
 * POST /api/postback
 *
 * Receives S2S conversion callbacks from affiliate networks.
 * Bearer-authenticated via POSTBACK_SECRET. Idempotent by orderId.
 *
 * Network config (in each network's dashboard):
 *   URL:    https://gamedeals.vercel.app/api/postback
 *   Method: POST
 *   Header: Authorization: Bearer ${POSTBACK_SECRET}
 *   Body:   { order_id, store_id, game_slug, click_id, commission_cents, currency, status }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authError = verifyPostbackAuth(request);
  if (authError) return authError;

  let payload: PostbackPayload;
  try {
    payload = (await request.json()) as PostbackPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const orderId = typeof payload.order_id === 'string' ? payload.order_id : null;
  const storeId = typeof payload.store_id === 'string' ? payload.store_id : null;
  if (!orderId || !storeId) {
    return NextResponse.json(
      { error: 'Missing required fields: order_id, store_id' },
      { status: 400 }
    );
  }

  const status = typeof payload.status === 'string' ? payload.status : 'pending';
  const normalizedStatus = VALID_STATUSES.has(status) ? status : 'pending';
  const commissionCents =
    typeof payload.commission_cents === 'number' && Number.isFinite(payload.commission_cents)
      ? Math.round(payload.commission_cents)
      : 0;
  const currency = typeof payload.currency === 'string' ? payload.currency.slice(0, 3) : 'USD';
  const gameSlug = typeof payload.game_slug === 'string' ? payload.game_slug.slice(0, 255) : null;
  const clickId =
    typeof payload.click_id === 'string' && /^[0-9a-f-]{36}$/i.test(payload.click_id)
      ? payload.click_id
      : null;

  try {
    // Upsert by orderId. Networks retry — first INSERT wins; subsequent same orderId
    // updates status if it transitioned (e.g. pending → approved → paid).
    await db.execute(sql`
      INSERT INTO affiliate_conversions (
        "storeId", "gameSlug", "orderId", "clickId",
        "commissionCents", "currency", "status", "rawPayload"
      )
      VALUES (
        ${storeId}, ${gameSlug}, ${orderId}, ${clickId}::uuid,
        ${commissionCents}, ${currency}, ${normalizedStatus}, ${JSON.stringify(payload)}::jsonb
      )
      ON CONFLICT ("orderId") DO UPDATE SET
        "status" = CASE
          WHEN affiliate_conversions."status" = 'paid' THEN affiliate_conversions."status"
          ELSE EXCLUDED."status"
        END,
        "commissionCents" = EXCLUDED."commissionCents",
        "rawPayload" = EXCLUDED."rawPayload"
    `);
  } catch (err) {
    console.error('postback insert failed:', err);
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
