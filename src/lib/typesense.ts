import TypesenseInstantsearchAdapter from 'typesense-instantsearch-adapter';

/**
 * Typesense client pra search
 * Configura via env vars:
 *   TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_API_KEY, TYPESENSE_COLLECTION_NAME
 */

export const TYPESENSE_CONFIG = {
  host: process.env.TYPESENSE_HOST || 'localhost',
  port: parseInt(process.env.TYPESENSE_PORT || '8108'),
  apiKey: process.env.TYPESENSE_API_KEY || '',
  collectionName: process.env.TYPESENSE_COLLECTION_NAME || 'games',
  protocol: process.env.TYPESENSE_PROTOCOL || 'http',
};

/**
 * Schema da collection Typesense
 */
export const GAME_SCHEMA = {
  name: TYPESENSE_CONFIG.collectionName,
  fields: [
    { name: 'gameID', type: 'string', facet: false },
    { name: 'title', type: 'string', facet: false },
    { name: 'thumb', type: 'string', facet: false },
    { name: 'cheapest', type: 'string', facet: false },
    { name: 'cheapestPrice', type: 'float', facet: false },
    { name: 'metacriticScore', type: 'int32', facet: false, optional: true },
    { name: 'steamRating', type: 'int32', facet: false, optional: true },
    { name: 'developer', type: 'string', facet: true, optional: true },
    { name: 'publisher', type: 'string', facet: true, optional: true },
    { name: 'genre', type: 'string[]', facet: true, optional: true },
    { name: 'platform', type: 'string[]', facet: true, optional: true },
  ],
  default_sorting_field: 'cheapestPrice',
  token_separators: ['-', '_', '/'],
  symbols_to_index: ['-', '_', '/'],
};

/**
 * Cria adapter pro InstantSearch (client-side)
 */
export function createTypesenseAdapter() {
  return new TypesenseInstantsearchAdapter({
    server: {
      nodes: [
        {
          host: TYPESENSE_CONFIG.host,
          port: TYPESENSE_CONFIG.port,
          protocol: TYPESENSE_CONFIG.protocol,
        },
      ],
      apiKey: TYPESENSE_CONFIG.apiKey,
    },
    collectionSpecificSearchParameters: {
      [TYPESENSE_CONFIG.collectionName]: {
        sort_by: 'cheapestPrice:asc',
      },
    },
  });
}

/**
 * Typesense client pra server-side search
 */
export async function searchGames(query: string, limit = 10) {
  const url = `${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}`;
  
  const params = new URLSearchParams({
    q: query,
    query_by: 'title,developer,publisher',
    query_by_weights: '100,50,50',
    limit: limit.toString(),
    typo_tolerance: 'true',
    split_join_tokens: 'always',
  });

  const response = await fetch(
    `${url}/collections/${TYPESENSE_CONFIG.collectionName}/documents/search?${params}`,
    {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey,
      },
    }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.hits || [];
}

/**
 * Indexa um jogo no Typesense
 */
export async function indexGame(game: {
  gameID: string;
  title: string;
  thumb: string;
  cheapest: string;
  metacriticScore?: number;
  steamRating?: number;
  developer?: string;
  publisher?: string;
  genre?: string[];
  platform?: string[];
}) {
  const url = `${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}`;

  const response = await fetch(
    `${url}/collections/${TYPESENSE_CONFIG.collectionName}/documents`,
    {
      method: 'POST',
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...game,
        cheapestPrice: parseFloat(game.cheapest) || 0,
      }),
    }
  );

  return response.ok;
}

/**
 * Batch index de jogos
 */
export async function indexGamesBatch(games: Array<{
  gameID: string;
  title: string;
  thumb: string;
  cheapest: string;
  metacriticScore?: number;
  steamRating?: number;
  developer?: string;
  publisher?: string;
  genre?: string[];
  platform?: string[];
}>) {
  const url = `${TYPESENSE_CONFIG.protocol}://${TYPESENSE_CONFIG.host}:${TYPESENSE_CONFIG.port}`;

  const documents = games.map((g) => ({
    ...g,
    cheapestPrice: parseFloat(g.cheapest) || 0,
  }));

  // Use upsert pra evitar duplicatas (document_key = gameID)
  const response = await fetch(
    `${url}/collections/${TYPESENSE_CONFIG.collectionName}/documents/import?action=upsert`,
    {
      method: 'POST',
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.apiKey,
        'Content-Type': 'application/jsonl',
      },
      body: documents.map((d) => JSON.stringify(d)).join('\n'),
    }
  );

  return response.ok;
}
