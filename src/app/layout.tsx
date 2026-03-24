import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import SyncManager from "@/components/SyncManager";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SearchModal from "@/components/SearchModal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameDeals | Find the Best Prices",
  description: "Aggregator of the best game deals across all digital stores.",
};


export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Navbar />
        <SyncManager />
        {children}
        {modal}
        <Analytics />
        <SpeedInsights />
        <SearchModal />
      </body>
    </html>
  );
}

