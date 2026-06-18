'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              Critical error
            </h1>
            <p
              style={{
                color: '#999',
                marginBottom: '1.5rem',
                maxWidth: '400px',
              }}
            >
              Something went very wrong. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#166534',
                color: '#bbf7d0',
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
      </body>
    </html>
  );
}
