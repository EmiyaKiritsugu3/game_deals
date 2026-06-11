import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import Navbar from '@/components/Navbar';
import CookieBanner from '@/components/CookieBanner';
import SyncManager from '@/components/SyncManager';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { createClient } from '@/utils/supabase/server';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const SITE_URL = 'https://gamedeals.com.br';
const SITE_NAME = 'GameDeals';
const SITE_DESCRIPTION = 'Find the best game prices across Steam, Epic, GOG, and more. Track price drops, set alerts, and never miss a deal.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Best Game Deals & Price Tracking`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['game deals', 'cheap games', 'steam deals', 'epic games', 'gog', 'price tracker', 'game prices', 'best deals', 'game sales'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Best Game Deals & Price Tracking`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Game Deals`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Best Game Deals`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <NuqsAdapter>
          <ReactQueryProvider>
            <Navbar serverUser={user} />
            <SyncManager />
            {children}
            {modal}
            <Analytics />
            <SpeedInsights />
            <CookieBanner />
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
