import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inscrição cancelada — GameDeals' };

export default function NewsletterUnsubscribedPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Inscrição cancelada</h1>
      <p className="text-sm text-white/80">
        Você não vai receber mais nossos e-mails. Sentiremos sua falta!
      </p>
      <a
        href="/deals"
        className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-cyan-950 hover:bg-cyan-300"
      >
        Voltar aos deals →
      </a>
    </main>
  );
}
