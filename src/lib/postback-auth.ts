import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Verify Bearer secret on /api/postback.
 * Networks (Impact, Awin, PartnerStack, CJ, Kinguin, Gamivo) are configured to send
 * `Authorization: Bearer ${POSTBACK_SECRET}` when registering the postback URL.
 *
 * ponytail: unified Bearer instead of per-network HMAC — defer per-network schemes
 * until a network refuses plain Bearer in their dashboard.
 */
export function verifyPostbackAuth(request: Request): NextResponse | null {
  const secret = process.env.POSTBACK_SECRET;
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
