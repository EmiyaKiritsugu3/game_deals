/**
 * Curated list of "official retailers" — stores that sell keys they've
 * been authorized to sell by the game's publisher (as opposed to
 * marketplaces / key resellers where individual users list keys).
 *
 * Used to render a Verified badge on deal cards and detail-dialog store
 * comparisons, so users can prefer safer storefronts at a glance.
 *
 * StoreIDs are CheapShark's stable identifiers (see https://apidocs.cheapshark.com).
 */
export const OFFICIAL_RETAILER_STORE_IDS = new Set<string>([
  '1', // Steam
  '2', // GamersGate
  '3', // Green Man Gaming
  '5', // GOG (Good Old Games)
  '6', // Origin / EA App
  '7', // Gamesplanet
  '8', // Gamesload
  '10', // GameBillet
  '11', // Fanatical
  '13', // Indiegala
  '14', // Humble Bundle
  '15', // Epic Games Store
  '21', // WinGameStore
  '22', // FunStockDigital
  '23', // Game.uk
  '25', // Direct2Drive
  '27', // Nuuvem
  '28', // DLGamer
  '29', // Battlenet (Blizzard)
  '31', // Ubisoft Store
  '32', // GamesRepublic
  '33', // SilaGames
  '34', // Playfield
  '35', // ImperialGames
  '37', // JoyBuggy
  '40', // Gamesource
]);

/**
 * Returns true if the given storeID is an official/authorized retailer
 * (vs. a marketplace or grey-market key reseller).
 */
export function isOfficialRetailer(storeID: string | undefined | null): boolean {
  if (!storeID) return false;
  return OFFICIAL_RETAILER_STORE_IDS.has(String(storeID));
}

/**
 * Tier classification for display purposes.
 * - "official": publisher-authorized retailer (Steam, Epic, GOG, …)
 * - "marketplace": key reseller / grey market (G2A, Kinguin, Eneba, …)
 * - "unknown": not enough info to classify
 */
export type StoreTier = 'official' | 'marketplace' | 'unknown';

const MARKETPLACE_STORE_IDS = new Set<string>([
  '16', // G2A
  '17', // Kinguin
  '18', // Instant Gaming (grey market)
  '19', // MMOGA
  '24', // CDKeys
  '26', // Electronic First
  '30', // DLGamer (sometimes considered marketplace — leave as unknown)
  '36', // SiliGame (unknown)
  '38', // jawaker (unknown)
]);

export function getStoreTier(storeID: string | undefined | null): StoreTier {
  if (!storeID) return 'unknown';
  const id = String(storeID);
  if (OFFICIAL_RETAILER_STORE_IDS.has(id)) return 'official';
  if (MARKETPLACE_STORE_IDS.has(id)) return 'marketplace';
  return 'unknown';
}
