const OFFICIAL_RETAILER_STORE_IDS = new Set([
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

export function isOfficialRetailer(storeID: string): boolean {
  return OFFICIAL_RETAILER_STORE_IDS.has(storeID);
}
