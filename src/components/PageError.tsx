'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  pageName: string;
}

export default function PageError({ error, reset, pageName }: Readonly<PageErrorProps>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Something went wrong loading {pageName}
        </h1>
        <p style={{ color: 'hsl(226 10% 65%)', marginBottom: '1.5rem', maxWidth: '400px' }}>
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.625rem 1.5rem',
            backgroundColor: 'hsl(150 88% 27%)',
            color: 'hsl(150 100% 85%)',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
