export const OFFICIAL_RETAILER_STORE_IDS = new Set([
  '1', // Steam
  '7', // GOG
  '8', // EA Origin
  '11', // Humble Store
  '13', // Uplay
  '25', // Epic Games
  '31', // Blizzard
  '27', // Gamesplanet
  '28', // GameBillet
  '29', // Voidu
  '30', // GamersGate
  '32', // Fanatical
  '33', // Indiegala
  '34', // DLGamer
  '35', // Amazon
  '36', // GreenManGaming
  '37', // Wingamestore
  '38', // MacGameStore
  '39', // Nuuvem
  '40', // WinGameStore
  '41', // Direct2Drive
  '42', // Gamelevate
  '43', // 2Game
  '44', // Gamesload
  '45', // Instant Gaming (official section)
]);

export const MARKETPLACE_STORE_IDS = new Set([
  '101', // CDKeys
  '102', // Kinguin
  '103', // Eneba
  '104', // Gamivo
]);

export type StoreTier = 'official' | 'marketplace' | 'unknown';

export function isOfficialRetailer(storeID: string): boolean {
  return OFFICIAL_RETAILER_STORE_IDS.has(storeID);
}

export function isMarketplace(storeID: string): boolean {
  return MARKETPLACE_STORE_IDS.has(storeID);
}

export function getStoreTier(storeID: string): 'official' | 'marketplace' | 'unknown' {
  if (isOfficialRetailer(storeID)) return 'official';
  if (isMarketplace(storeID)) return 'marketplace';
  return 'unknown';
}
