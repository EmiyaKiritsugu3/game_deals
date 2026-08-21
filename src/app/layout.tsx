import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'DEALFORGE — Premium Game Deals, Live Prices',
  description:
    'Score legendary game deals across every major PC storefront. Real-time price tracking for 60,000+ games, with wishlist, price alerts, and best-price comparison.',
  keywords: [
    'game deals',
    'cheap games',
    'steam deals',
    'epic games deals',
    'PC game discounts',
    'game price tracker',
  ],
  authors: [{ name: 'DEALFORGE' }],
  icons: {
    icon: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg',
  },
  openGraph: {
    title: 'DEALFORGE — Premium Game Deals',
    description: 'Live prices across every store. Never overpay for a game again.',
    siteName: 'DEALFORGE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DEALFORGE — Premium Game Deals',
    description: 'Live prices across every store. Never overpay for a game again.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <main id="main-content">{children}</main>
          <SonnerToaster position="bottom-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
