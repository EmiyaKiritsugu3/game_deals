import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { welcomeEmail } from '@/lib/email-templates';
import { sendEmail } from '@/lib/resend';

/**
 * GET /api/subscribe/confirm?token=<uuid>
 * Double opt-in confirmation: 'pending' → 'active', then welcome email.
 */
export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.confirmToken, token),
        eq(newsletterSubscribers.status, 'pending')
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.redirect(`${siteUrl}/newsletter/confirmed?state=done`, 303);
  }

  await db
    .update(newsletterSubscribers)
    .set({ status: 'active', confirmedAt: new Date() })
    .where(eq(newsletterSubscribers.id, row.id));

  try {
    const { subject, html } = welcomeEmail({ email: row.email });
    await sendEmail({ to: row.email, subject, html });
  } catch {
    // ponytail: log-and-continue; resend manually if needed.
  }

  return NextResponse.redirect(`${siteUrl}/newsletter/confirmed`, 303);
}
