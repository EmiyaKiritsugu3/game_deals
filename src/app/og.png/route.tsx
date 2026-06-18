import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1030 50%, #0a0a0f 100%)',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          aria-label="GameDeals"
        >
          <title>GameDeals</title>
          <path d="M6 11V7a6 6 0 1 1 12 0v4" />
          <rect x="3" y="10" width="18" height="12" rx="2" />
          <circle cx="12" cy="16" r="1" fill="#8b5cf6" />
          <path d="M12 13v3" />
        </svg>
        <span
          style={{
            fontSize: '64px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          GameDeals
        </span>
      </div>
      <span
        style={{
          fontSize: '32px',
          fontWeight: '400',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        Find the best game deals across 17+ stores
      </span>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
