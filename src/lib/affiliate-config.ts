export interface AffiliateConfig {
  baseUrl: string;
  params: Record<string, string>;
}

export const affiliateConfig: Record<string, AffiliateConfig> = {
  '1': { baseUrl: 'https://store.steampowered.com', params: {} },
  '7': { baseUrl: 'https://www.gog.com', params: { affiliate: 'gamedeals' } },
  '11': {
    baseUrl: 'https://www.humblebundle.com',
    params: { charity: 'gamedeals', partner: 'gamedealsBR' },
  },
  '15': {
    baseUrl: 'https://www.fanatical.com',
    params: { aff_id: 'gamedeals_fnt' },
  },
  '21': {
    baseUrl: 'https://www.wingamestore.com',
    params: { aff: 'gamedeals' },
  },
  '24': { baseUrl: 'https://store.epicgames.com', params: {} },
  '25': { baseUrl: 'https://www.gamebillet.com', params: { aff: 'gamedeals' } },
  '27': { baseUrl: 'https://www.voidu.com', params: { aff: 'gamedeals' } },
  '29': {
    baseUrl: 'https://www.gamesplanet.com',
    params: { aff: 'gamedeals' },
  },
  '31': {
    baseUrl: 'https://games.indiegala.com',
    params: { aff: 'gamedeals' },
  },
  '33': { baseUrl: 'https://www.dlgamer.com', params: { aff: 'gamedeals' } },
  '37': { baseUrl: 'https://www.dlgamer.com', params: { aff: 'gamedeals' } },
  '38': { baseUrl: 'https://www.nuuvem.com', params: {} },
  '101': {
    baseUrl: 'https://www.cdkeys.com',
    params: { mw_aref: 'gamedeals_link' },
  },
  '102': { baseUrl: 'https://www.kinguin.net', params: {} },
  '103': {
    baseUrl: 'https://www.eneba.com',
    params: { af_id: 'gamedeals_prod' },
  },
  '104': { baseUrl: 'https://www.gamivo.com', params: {} },
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
