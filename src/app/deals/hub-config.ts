export const STORE_HUB = [
  { slug: 'humble', label: 'Humble Store', storeId: '11' },
  { slug: 'fanatical', label: 'Fanatical', storeId: '15' },
  { slug: 'eneba', label: 'Eneba', storeId: '103' },
  { slug: 'cdkeys', label: 'CDKeys', storeId: '101' },
  { slug: 'kinguin', label: 'Kinguin', storeId: '102' },
  { slug: 'gamivo', label: 'Gamivo', storeId: '104' },
  { slug: 'wingamestore', label: 'WinGameStore', storeId: '21' },
  { slug: 'gamebillet', label: 'GameBillet', storeId: '23' },
  { slug: 'voidu', label: 'Voidu', storeId: '24' },
  { slug: 'gamesplanet', label: 'Gamesplanet', storeId: '27' },
  { slug: 'indiegala', label: 'IndieGala', storeId: '30' },
  { slug: 'dlgamer', label: 'DLGamer', storeId: '33' },
  { slug: 'nuuvem', label: 'Nuuvem', storeId: '38' },
] as const;

export const GENRE_HUB = [
  { slug: 'aaa', label: 'AAA', query: { AAA: '1' } },
  { slug: 'altamente-avaliados', label: 'Altamente Avaliados', query: { metacritic: '85' } },
  { slug: 'indie', label: 'Indie', query: { upperPrice: '20' } },
  { slug: 'rpg', label: 'RPG', query: { metacritic: '75' } },
] as const;

export const PRICE_HUB = [
  { slug: 'under-10', label: 'Under $10', query: { upperPrice: '10' } },
  { slug: 'under-20', label: 'Under $20', query: { upperPrice: '20' } },
  { slug: 'under-30', label: 'Under $30', query: { upperPrice: '30' } },
] as const;

export function formatCount(n: number): string {
  if (n === 0) return 'sem ofertas ativas';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k ofertas`;
  return `${n} ofertas`;
}
