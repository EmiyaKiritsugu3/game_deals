'use client';

import { useState } from 'react';

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
      else throw new Error();
    } catch {
      setError('Não foi possível iniciar o checkout. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <main className="container flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-white">GameDeals Premium 🏆</h1>
      <p className="max-w-md text-sm text-white/80">
        Sem anúncios, alertas prioritários e suporte ao projeto. Cancele quando quiser.
      </p>
      <ul className="flex flex-col gap-2 text-left text-sm text-white/90">
        <li>🚫 Zero anúncios em todo o site</li>
        <li>⚡ Alertas de preço prioritários</li>
        <li>❤️ Ajuda a manter o GameDeals no ar</li>
      </ul>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="rounded-lg bg-cyan-400 px-8 py-3 font-semibold text-cyan-950 transition hover:bg-cyan-300 disabled:opacity-50"
      >
        {loading ? 'Redirecionando…' : 'Assinar por R$ 10/mês'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-white/60">Pagamento seguro processado pelo Stripe.</p>
    </main>
  );
}
