/**
 * Typesense client pra search
 * Configura via env vars:
 *   TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_ADMIN_KEY (server), NEXT_PUBLIC_TYPESENSE_SEARCH_KEY (client)
 */

const TYPESENSE_COLLECTION_NAME = process.env.TYPESENSE_COLLECTION_NAME || 'games';

/**
 * Schema da collection Typesense
 */

/**
 * Typesense client pra server-side search
 */
export async function searchGames(query: string, limit = 10) {
  const host = process.env.TYPESENSE_HOST || 'localhost';
  const port = Number.parseInt(process.env.TYPESENSE_PORT || '443', 10);
  const protocol = process.env.TYPESENSE_PROTOCOL || 'https';
  const apiKey =
    process.env.TYPESENSE_ADMIN_KEY || process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '';

  const url = `${protocol}://${host}:${port}`;

  const params = new URLSearchParams({
    q: query,
    query_by: 'title,developer,publisher',
    query_by_weights: '100,50,50',
    limit: limit.toString(),
    typo_tolerance: 'true',
    split_join_tokens: 'always',
  });

  const response = await fetch(
    `${url}/collections/${TYPESENSE_COLLECTION_NAME}/documents/search?${params}`,
    {
      headers: { 'X-TYPESENSE-API-KEY': apiKey },
    }
  );

  if (!response.ok) return [];
  const data = (await response.json()) as {
    hits: Array<Record<string, unknown>>;
  };
  return data.hits || [];
}

/**
 * Batch index de jogos
 */
export async function indexGamesBatch(
  games: Array<{
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
  }>
) {
  const host = process.env.TYPESENSE_HOST || 'localhost';
  const port = Number.parseInt(process.env.TYPESENSE_PORT || '443', 10);
  const protocol = process.env.TYPESENSE_PROTOCOL || 'https';
  const apiKey = process.env.TYPESENSE_ADMIN_KEY || '';

  const documents = games.map((g) => ({
    ...g,
    cheapestPrice: Number.parseFloat(g.cheapest) || 0,
  }));

  const url = `${protocol}://${host}:${port}/collections/${TYPESENSE_COLLECTION_NAME}/documents/import?action=upsert`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-TYPESENSE-API-KEY': apiKey,
      'Content-Type': 'application/jsonl',
    },
    body: documents.map((d) => JSON.stringify(d)).join('\n'),
  });

  return response.ok;
}
