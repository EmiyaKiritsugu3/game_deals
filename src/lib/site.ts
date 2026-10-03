/**
 * Global site defaults — single source of truth for locale-facing constants.
 * Single-locale global (en-US, USD). Multi-region (hreflang, per-region
 * currency) is a later phase; every consumer must read from here so the
 * switch is one file.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com';

/** CheapShark prices are USD — format accordingly, no locale comma decimals. */
export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}
