export const STORE_FAVICON_MAP: Record<string, string> = {
  // Official Stores (from CheapShark)
  '1': 'https://www.steampowered.com/favicon.ico', // Steam
  '2': 'https://www.gamersgate.com/favicon.ico', // GamersGate
  '3': 'https://www.greenmangaming.com/favicon.ico', // GreenManGaming
  '7': 'https://www.gog.com/favicon.ico', // GOG
  '8': 'https://www.origin.com/favicon.ico', // Origin
  '11': 'https://www.humblebundle.com/favicon.ico', // Humble Store
  '13': 'https://www.amazon.com/favicon.ico', // Amazon
  '15': 'https://www.fanatical.com/favicon.ico', // Fanatical
  '21': 'https://www.wingamestore.com/favicon.ico', // WinGameStore
  '24': 'https://www.epic.com/favicon.ico', // Epic Games
  '25': 'https://www.gamebillet.com/favicon.ico', // GameBillet
  '27': 'https://www.voidu.com/favicon.ico', // Voidu
  '28': 'https://store.epicgames.com/favicon.ico', // Epic Games Store
  '29': 'https://www.gamesplanet.com/favicon.ico', // GamesPlanet
  '31': 'https://games.indiegala.com/favicon.ico', // IndieGala
  '33': 'https://www.gamersgate.com/favicon.ico', // DLGamer
  '34': 'https://microsoft.com/favicon.ico', // Microsoft Store
  '35': 'https://www.indiegamestand.com/favicon.ico', // IndieGameStand
  '37': 'https://www.dlgamer.com/favicon.ico', // DLGamer
  '38': 'https://www.nuuvem.com/favicon.ico', // Nuuvem

  // Simulated Grey Market Keyshops
  '101': 'https://www.cdkeys.com/favicon.ico', // CDKeys
  '102': 'https://www.kinguin.net/favicon.ico', // Kinguin
  '103': 'https://www.eneba.com/favicon.ico', // Eneba
  '104': 'https://www.gamivo.com/favicon.ico', // Gamivo
};

export const GREY_MARKET_SHOPS = [
  { id: '101', name: 'CDKeys' },
  { id: '102', name: 'Kinguin' },
  { id: '103', name: 'Eneba' },
  { id: '104', name: 'Gamivo' },
];

export const STEAM_STORES = [
  '1',
  '2',
  '3',
  '11',
  '13',
  '15',
  '21',
  '25',
  '27',
  '29',
  '31',
  '33',
  '37',
  '38',
  '101',
  '102',
  '103',
  '104',
];
export const GOG_STORES = ['7'];
export const EPIC_STORES = ['24', '28'];
export const ORIGIN_STORES = ['8'];
export const MS_STORES = ['34'];
