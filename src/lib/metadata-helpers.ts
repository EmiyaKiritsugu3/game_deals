import type { Metadata } from 'next';
import { getHighResImage } from '@/services/api';

export const SITE_URL = 'https://gamedeals.com.br';

export function extractTitle(gameTitle: string, bestPrice: string | undefined): string {
  return `${gameTitle} — Best Price: $${bestPrice || 'N/A'}`;
}

export function extractDescription(
  gameTitle: string,
  bestPrice: string | undefined,
  cheapestEver: string,
  dealCount: number
): string {
  return `Find the best deal for ${gameTitle}. Current lowest price: $${bestPrice || 'N/A'}. Historical low: $${cheapestEver}. Compare prices across ${dealCount} stores.`;
}

export function buildOG(
  title: string,
  description: string,
  thumb: string,
  id: string
): NonNullable<Metadata['openGraph']> {
  return {
    title,
    description,
    url: `${SITE_URL}/game/${id}`,
    siteName: 'GameDeals',
    images: [{ url: getHighResImage(thumb), width: 600, height: 300, alt: title }],
    type: 'website',
  };
}

export function buildTwitter(
  title: string,
  description: string,
  thumb: string
): NonNullable<Metadata['twitter']> {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [getHighResImage(thumb)],
  };
}
