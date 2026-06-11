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

export const metadata: Metadata = {
  title: 'GameDeals | Find the Best Prices',
  description: 'Aggregator of the best game deals across all digital stores.',
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
  return (
    <html lang="en">
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
