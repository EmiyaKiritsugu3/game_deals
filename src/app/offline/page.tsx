import Link from 'next/link';

export const metadata = {
  title: 'Offline — GameDeals',
  description: 'You are offline',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-3xl font-bold">You&apos;re offline</h1>
      <p className="max-w-md text-neutral-400">
        It looks like you&apos;ve lost your connection. Don&apos;t worry — we&apos;ll be back as
        soon as you reconnect.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
      >
        Try again
      </Link>
    </div>
  );
}
