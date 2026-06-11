import { NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!, { connect_timeout: 5 });

// Mapeamento storeId → affiliate params
const AFFILIATE_CONFIG: Record<string, {
  baseUrl: string;
  params: Record<string, string>;
}> = {
  '1': { baseUrl: 'https://store.steampowered.com', params: {} },
  '7': { baseUrl: 'https://www.gog.com', params: { affiliate: 'gamedeals' } },
  '11': { baseUrl: 'https://www.humblebundle.com', params: { charity: 'gamedeals', partner: 'gamedealsBR' } },
  '15': { baseUrl: 'https://www.fanatical.com', params: { aff_id: 'gamedeals_fnt' } },
  '21': { baseUrl: 'https://www.wingamestore.com', params: { aff: 'gamedeals' } },
  '24': { baseUrl: 'https://store.epicgames.com', params: {} },
  '25': { baseUrl: 'https://www.gamebillet.com', params: { aff: 'gamedeals' } },
  '27': { baseUrl: 'https://www.voidu.com', params: { aff: 'gamedeals' } },
  '29': { baseUrl: 'https://www.gamesplanet.com', params: { aff: 'gamedeals' } },
  '31': { baseUrl: 'https://games.indiegala.com', params: { aff: 'gamedeals' } },
  '33': { baseUrl: 'https://www.dlgamer.com', params: { aff: 'gamedeals' } },
  '37': { baseUrl: 'https://www.dlgamer.com', params: { aff: 'gamedeals' } },
  '38': { baseUrl: 'https://www.nuuvem.com', params: {} },
  '101': { baseUrl: 'https://www.cdkeys.com', params: { mw_aref: 'gamedeals_link' } },
  '102': { baseUrl: 'https://www.kinguin.net', params: {} },
  '103': { baseUrl: 'https://www.eneba.com', params: { af_id: 'gamedeals_prod' } },
  '104': { baseUrl: 'https://www.gamivo.com', params: {} },
};

/**
 * GET /out/[storeId]/[gameSlug]
 * Redireciona pro deal com affiliate tracking
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string; gameSlug: string }> }
) {
  const { storeId, gameSlug } = await params;

  // Buscar deal link do banco ou CheapShark
  let targetUrl = '';

  try {
    // Tentar buscar do banco primeiro
    const [deal] = await sql`
      SELECT url, "storeId" FROM deals
      WHERE "storeId" = ${storeId}
      LIMIT 1
    `;

    if (deal?.url) {
      targetUrl = deal.url;
    }
  } catch {
    // Fallback pra CheapShark redirect
    targetUrl = `https://www.cheapshark.com/redirect?dealID=${gameSlug}`;
  }

  // Aplicar affiliate params
  const config = AFFILIATE_CONFIG[storeId];
  if (config) {
    const url = new URL(targetUrl || config.baseUrl);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    targetUrl = url.toString();
  }

  // Log click no banco (fire-and-forget)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  sql`
    INSERT INTO affiliate_clicks ("storeId", "gameSlug", ip, "timestamp")
    VALUES (${storeId}, ${gameSlug}, ${ip}, NOW())
  `.catch(() => {}); // non-blocking

  // Redirect
  if (targetUrl) {
    return NextResponse.redirect(targetUrl, 302);
  }

  return NextResponse.redirect('/', 302);
}
