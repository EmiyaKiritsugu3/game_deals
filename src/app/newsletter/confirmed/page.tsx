import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inscrição confirmada — GameDeals' };

export default function NewsletterConfirmedPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Inscrição confirmada! 🎉</h1>
      <p className="text-sm text-slate-200">
        Você vai receber as melhores promoções de jogos direto no seu e-mail.
      </p>
      <a
        href="/deals"
        className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-cyan-950 hover:bg-cyan-300"
      >
        Ver deals →
      </a>
    </main>
  );
}
