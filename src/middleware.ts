import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - api/cron (cron endpoints — match cron routes specifically, not entire api/*)
     * - public files (images, etc)
     */
    String.raw`((?!_next/static|_next/image|favicon.ico|api/cron(?:/|$)|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`,
  ],
};
