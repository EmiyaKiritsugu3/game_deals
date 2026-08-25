import { ImageResponse } from 'next/og';
import { getGame } from '@/services/api';
import { getCheapestDeal } from '@/utils/pricing';

export const runtime = 'edge';

/**
 * GET /og.png/[id]
 * Dynamic OG image per game — title + cheapest price + savings %.
 * Returns 1200x630 PNG. Crawled by Facebook, Twitter, Discord, etc.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game?.info) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1030 50%, #0a0a0f 100%)',
          color: 'white',
          fontSize: 48,
        }}
      >
        GameDeals — Deal Not Found
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const bestDeal = getCheapestDeal(game.deals);
  const price = bestDeal ? `$${Number.parseFloat(bestDeal.price).toFixed(2)}` : '—';
  const retail = bestDeal ? `$${Number.parseFloat(bestDeal.retailPrice).toFixed(2)}` : null;
  const savings =
    bestDeal && Number.parseFloat(bestDeal.savings) > 0
      ? `-${Math.round(Number.parseFloat(bestDeal.savings))}%`
      : null;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1030 50%, #0a0a0f 100%)',
        padding: '60px 80px',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <span style={{ fontSize: '24px', color: '#8b5cf6', fontWeight: 600 }}>GameDeals</span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: '64px',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 'auto',
          maxWidth: '900px',
        }}
      >
        {game.info.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
        <span style={{ fontSize: '88px', fontWeight: 800, color: '#8b5cf6' }}>{price}</span>
        {retail ? (
          <span
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'line-through',
            }}
          >
            {retail}
          </span>
        ) : null}
        {savings ? (
          <span
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#22c55e',
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'rgba(34,197,94,0.15)',
            }}
          >
            {savings}
          </span>
        ) : null}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
