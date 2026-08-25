import { requireUser, UnauthorizedError } from '@/lib/require-user';
import { assertRateLimit } from '@/lib/server-action-rate-limit';
import { createCheckoutSession, StripeError } from '@/lib/stripe';

/**
 * POST /api/stripe/checkout - create premium Checkout Session (auth required).
 * Returns { url } to redirect to Stripe hosted checkout.
 */
export async function POST(): Promise<Response> {
  try {
    const user = await requireUser();
    await assertRateLimit('stripe-checkout', user.id, 5, 60_000);

    if (!user.email) {
      return Response.json({ error: 'Account has no email' }, { status: 400 });
    }

    const url = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      origin: process.env.NEXT_PUBLIC_SITE_URL ?? new URL('https://gamedeals.com.br').origin,
    });

    return Response.json({ url });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof StripeError) {
      console.error(
        JSON.stringify({ level: 'error', msg: 'stripe_checkout_error', error: err.message })
      );
      return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
    }
    throw err;
  }
}
