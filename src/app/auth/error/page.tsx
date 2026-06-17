'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './page.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  rate_limit: 'Too many sign-in attempts. Please wait a moment and try again.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const message =
    ERROR_MESSAGES[reason ?? ''] ?? 'An error occurred during sign-in. Please try again.';

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign-in Error</h1>
        <p className={styles.message}>{message}</p>
        <Link href="/" className={styles.homeLink}>
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
        <main className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Sign-in Error</h1>
            <p className={styles.message}>Loading…</p>
          </div>
        </main>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
