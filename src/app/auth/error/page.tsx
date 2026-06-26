'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  rate_limit: 'Too many sign-in attempts. Please wait a moment and try again.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const message =
    ERROR_MESSAGES[reason ?? ''] ?? 'An error occurred during sign-in. Please try again.';

  return (
    <main className="min-h-[50vh] flex items-center justify-center p-8 text-center">
      <div className="max-w-[400px] w-full">
        <h1 className="text-2xl font-semibold mb-3 text-foreground">Sign-in Error</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{message}</p>
        <Link
          href="/"
          className="inline-block px-6 py-[0.625rem] bg-accent-hl text-accent-hl-foreground border-none rounded-md text-sm font-medium cursor-pointer no-underline transition-opacity duration-150 hover:opacity-85"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center p-8 text-center">
          <div className="max-w-[400px] w-full">
            <h1 className="text-2xl font-semibold mb-3 text-foreground">Sign-in Error</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">Loading…</p>
          </div>
        </main>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
