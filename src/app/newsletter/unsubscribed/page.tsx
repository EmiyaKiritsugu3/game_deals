import type { Metadata } from 'next';
import NewsletterStatusPage from '@/components/NewsletterStatusPage';

export const metadata: Metadata = { title: 'Inscrição cancelada — GameDeals' };

export default function NewsletterUnsubscribedPage() {
  return (
    <NewsletterStatusPage
      title="Inscrição cancelada"
      message="Você não vai receber mais nossos e-mails. Sentiremos sua falta!"
      ctaLabel="Voltar aos deals →"
    />
  );
}
