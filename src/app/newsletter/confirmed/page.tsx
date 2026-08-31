import type { Metadata } from 'next';
import NewsletterStatusPage from '@/components/NewsletterStatusPage';

export const metadata: Metadata = { title: 'Inscrição confirmada — GameDeals' };

export default function NewsletterConfirmedPage() {
  return (
    <NewsletterStatusPage
      title="Inscrição confirmada! 🎉"
      message="Você vai receber as melhores promoções de jogos direto no seu e-mail."
      messageClassName="text-slate-200"
      ctaLabel="Ver deals →"
    />
  );
}
