'use server';

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load .env.local pra server-side
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!, { connect_timeout: 10 });

interface CheapSharkDeal {
  dealID: string;
  storeID: string;
  gameID: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  dealRating: string;
  thumb: string;
}

/**
 * Ingestão de preços — busca deals da CheapShark e salva no banco
 * Chamado pelo cron job (a cada 4h)
 */
export async function ingestPricesAction(): Promise<{
  success: boolean;
  dealsIngested: number;
  gamesUpserted: number;
  error?: string;
}> {
  try {
    // 1. Buscar top deals da CheapShark
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=100',
      { next: { revalidate: 0 } } // sem cache pra ingestão
    );

    if (!res.ok) {
      return { success: false, dealsIngested: 0, gamesUpserted: 0, error: `CheapShark API error: ${res.status}` };
    }

    const deals: CheapSharkDeal[] = await res.json();
    if (!deals || deals.length === 0) {
      return { success: true, dealsIngested: 0, gamesUpserted: 0 };
    }

    let gamesUpserted = 0;
    let dealsIngested = 0;

    // 2. Upsert games únicos
    const uniqueGameIds = [...new Set(deals.map((d) => d.gameID))];

    for (const gameId of uniqueGameIds) {
      const deal = deals.find((d) => d.gameID === gameId);
      if (!deal) continue;

      await sql`
        INSERT INTO games (id, title, "cheapsharkId", "thumbUrl", "createdAt", "updatedAt")
        VALUES (${gameId}::uuid, ${deal.title}, ${deal.gameID}, ${deal.thumb}, NOW(), NOW())
        ON CONFLICT ("cheapsharkId") DO UPDATE SET
          title = ${deal.title},
          "thumbUrl" = ${deal.thumb},
          "updatedAt" = NOW()
      `;
      gamesUpserted++;
    }

    // 3. Inserir deals no banco
    for (const deal of deals) {
      await sql`
        INSERT INTO deals ("gameId", "storeId", price, "retailPrice", savings, "dealRating", url, "createdAt")
        VALUES (
          ${deal.gameID}::uuid,
          ${deal.storeID},
          ${deal.salePrice}::real,
          ${deal.normalPrice}::real,
          ${deal.savings}::real,
          ${deal.dealRating}::real,
          ${'https://www.cheapshark.com/redirect?dealID=' + deal.dealID},
          NOW()
        )
      `;
      dealsIngested++;
    }

    return { success: true, dealsIngested, gamesUpserted };
  } catch (error) {
    console.error('Ingest error:', error);
    return {
      success: false,
      dealsIngested: 0,
      gamesUpserted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Busca deals do banco (não da API)
 * Usado pra páginas que precisam de dados locais
 */
export async function getDealsFromDBAction(limit = 20) {
  'use cache';

  const deals = await sql`
    SELECT
      d."gameId",
      g.title,
      d."storeId",
      d.price,
      d."retailPrice",
      d.savings,
      d."dealRating",
      g."thumbUrl"
    FROM deals d
    JOIN games g ON g.id = d."gameId"
    ORDER BY d."dealRating" DESC
    LIMIT ${limit}
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return deals as unknown as any[];
}
