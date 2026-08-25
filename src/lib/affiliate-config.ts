export interface AffiliateConfig {
  baseUrl: string;
  /** Factory: params read at click time so env vars take effect without redeploy. */
  params: () => Record<string, string>;
}

/**
 * Affiliate program IDs.
 *
 * - env: read at click time via `AFF_*` vars; fall back to current placeholder if unset.
 * - Placeholders (e.g. 'gamedealsBR') are NOT recognized by any real program — clicks
 *   will not earn commission until real IDs land in `.env.local`.
 * - Apply at: Humble (PartnerStack), Fanatical (Impact), Eneba (Impact),
 *   CDKeys (CJ), Kinguin Partner, Gamivo Partner.
 */
export const affiliateConfig: Record<string, AffiliateConfig> = {
  '11': {
    baseUrl: 'https://www.humblebundle.com',
    params: () => ({
      charity: process.env.AFF_HUMBLE_CHARITY ?? 'gamedeals',
      partner: process.env.AFF_HUMBLE_PARTNER ?? 'gamedealsBR',
    }),
  },
  '15': {
    baseUrl: 'https://www.fanatical.com',
    params: () => ({
      aff_id: process.env.AFF_FANATICAL_ID ?? 'gamedeals_fnt',
    }),
  },
  '21': {
    baseUrl: 'https://www.wingamestore.com',
    params: () => ({
      aff: process.env.AFF_WINGAMESTORE_ID ?? 'gamedeals',
    }),
  },
  '25': {
    baseUrl: 'https://www.gamebillet.com',
    params: () => ({
      aff: process.env.AFF_GAMEBILLET_ID ?? 'gamedeals',
    }),
  },
  '27': {
    baseUrl: 'https://www.voidu.com',
    params: () => ({
      aff: process.env.AFF_VOIDU_ID ?? 'gamedeals',
    }),
  },
  '29': {
    baseUrl: 'https://www.gamesplanet.com',
    params: () => ({
      aff: process.env.AFF_GAMESPLANET_ID ?? 'gamedeals',
    }),
  },
  '31': {
    baseUrl: 'https://games.indiegala.com',
    params: () => ({
      aff: process.env.AFF_INDIEGALA_ID ?? 'gamedeals',
    }),
  },
  '33': {
    baseUrl: 'https://www.dlgamer.com',
    params: () => ({
      aff: process.env.AFF_DLGAMER_ID ?? 'gamedeals',
    }),
  },
  '37': {
    baseUrl: 'https://www.dlgamer.com',
    params: () => ({
      aff: process.env.AFF_DLGAMER_ID ?? 'gamedeals',
    }),
  },
  '38': {
    baseUrl: 'https://www.nuuvem.com',
    params: () => ({}),
  },
  '101': {
    baseUrl: 'https://www.cdkeys.com',
    params: () => ({
      mw_aref: process.env.AFF_CDKEYS_REF ?? 'gamedeals_link',
    }),
  },
  '102': {
    baseUrl: 'https://www.kinguin.net',
    params: () => ({
      partner_id: process.env.AFF_KINGUIN_ID ?? '',
    }),
  },
  '103': {
    baseUrl: 'https://www.eneba.com',
    params: () => ({
      af_id: process.env.AFF_ENEBA_ID ?? 'gamedeals_prod',
    }),
  },
  '104': {
    baseUrl: 'https://www.gamivo.com',
    params: () => ({
      partner_id: process.env.AFF_GAMIVO_ID ?? '',
    }),
  },
};

export const ALLOWED_DOMAINS = new Set(
  Object.values(affiliateConfig).map((c) => new URL(c.baseUrl).hostname)
);

export function isValidStoreId(storeId: string): boolean {
  return /^\d{1,3}$/.test(storeId) && storeId in affiliateConfig;
}

export function isValidGameSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(slug);
}
