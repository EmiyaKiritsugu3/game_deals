import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/wishlist', '/alerts', '/playlists', '/profile'] as const;

function isProtectedPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return PROTECTED_PATHS.some((p) => normalized === p || normalized.startsWith(`${p}/`));
}

function enforceAuthGate(user: { id: string } | null, request: NextRequest): NextResponse | null {
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/profile';
    return NextResponse.redirect(url);
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          supabaseResponse.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gate = enforceAuthGate(user, request);
  if (gate) return gate;
  return supabaseResponse;
}
