import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
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

    const [profile] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const url = await createCheckoutSession({
      userId: user.id,
      // username optional; fall back to auth id so Stripe always has a contact point.
      userEmail: profile?.username
        ? `${profile.username}@users.gamedeals.com.br`
        : `${user.id}@users.gamedeals.com.br`,
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
