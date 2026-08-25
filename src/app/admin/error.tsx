'use client';

import PageError from '@/components/PageError';

export default function AdminError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <PageError error={error} reset={reset} pageName="admin" />;
}
