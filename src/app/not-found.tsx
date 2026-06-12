import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>404 — Page Not Found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" style={{ color: '#4ade80', marginTop: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>
    </main>
  );
}
