import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (!safeEqual(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
