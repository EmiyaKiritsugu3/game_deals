import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/utils/supabase/server';

async function exchangeAuthCode(code: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return !error;
}

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
    const success = await exchangeAuthCode(code);
    if (success) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
