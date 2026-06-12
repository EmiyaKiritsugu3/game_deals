import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`auth:${ip}`, 10, 60000)) {
    return NextResponse.redirect(new URL('/auth/error?reason=rate_limit', request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Validate next is a local path
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
