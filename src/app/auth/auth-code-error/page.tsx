import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-[50vh] flex items-center justify-center p-8 text-center">
      <div className="max-w-[400px] w-full">
        <h1 className="text-2xl font-semibold mb-3 text-foreground">Invalid Sign-in Link</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
          The sign-in link is invalid or has expired. Please try signing in again.
        </p>
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
