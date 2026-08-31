export default function NewsletterStatusPage({
  title,
  message,
  ctaLabel,
  messageClassName = 'text-white/80',
}: {
  title: string;
  message: string;
  ctaLabel: string;
  messageClassName?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className={`text-sm ${messageClassName}`}>{message}</p>
      <a
        href="/deals"
        className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-cyan-950 hover:bg-cyan-300"
      >
        {ctaLabel}
      </a>
    </main>
  );
}
