import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { cronError, cronLog } from '@/lib/cron-log';
import { verifyWebhookSignature } from '@/lib/stripe';

/**
 * POST /api/stripe/webhook - Stripe events.
 * checkout.session.completed -> set premiumUntil (+30d) and store customer id.
 * customer.subscription.deleted -> clear premiumUntil.
 * Raw body needed for signature verification (not JSON-parsed).
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  if (!verifyWebhookSignature(payload, sig, secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const obj = event.data?.object ?? {};

  try {
    if (event.type === 'checkout.session.completed') {
      const userId = String(obj.client_reference_id ?? '');
      const customerId = typeof obj.customer === 'string' ? obj.customer : '';
      if (!userId) return Response.json({ received: true, note: 'no client_reference_id' });

      await db
        .update(profiles)
        .set({
          premiumUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          stripeCustomerId: customerId,
        })
        .where(eq(profiles.id, userId));
    }

    if (event.type === 'customer.subscription.deleted') {
      const customerId = typeof obj.customer === 'string' ? obj.customer : '';
      if (customerId) {
        await db
          .update(profiles)
          .set({ premiumUntil: null })
          .where(eq(profiles.stripeCustomerId, customerId));
      }
    }

    cronLog({ cron: 'stripe-webhook', event: event.type ?? 'unknown' });
    return Response.json({ received: true });
  } catch (err) {
    cronError({ cron: 'stripe-webhook' }, err);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
