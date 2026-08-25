import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';

/**
 * GET /api/unsubscribe?token=<uuid>
 * One-click unsubscribe (email footer link).
 * Redirects to friendly page regardless of whether token existed (no enumeration).
 */
export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.unsubscribeToken, token));

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/newsletter/unsubscribed`,
    303
  );
}
