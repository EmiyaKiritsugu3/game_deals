import { Suspense } from 'react';
import OutRedirector from './OutRedirector';

export const metadata = {
  title: 'Redirecting | GameDeals',
};

export default function OutPage() {
  return (
    <main className="container">
      <Suspense
        fallback={
          <div style={{ padding: '5rem', textAlign: 'center' }}>Loading secure link...</div>
        }
      >
        <OutRedirector />
      </Suspense>
    </main>
  );
}
