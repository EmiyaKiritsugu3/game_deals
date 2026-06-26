import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/utils/supabase/server';

function safeNext(next: string | null, origin: string): string {
  if (!next) return `${origin}/`;
  try {
    const url = new URL(next, origin);
    if (url.origin === origin) {
      return url.toString();
    }
  } catch {
    // Ignore invalid URLs
  }
  return `${origin}/`;
}

async function exchangeAuthCode(code: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return !error;
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!(await rateLimit(`auth:${ip}`, 10, 60000))) {
    return NextResponse.redirect(new URL('/auth/error?reason=rate_limit', request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const success = await exchangeAuthCode(code);
    if (success) {
      return NextResponse.redirect(safeNext(next, origin));
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
