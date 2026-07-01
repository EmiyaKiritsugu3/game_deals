'use client';

interface MiniSparklineProps {
  /** Synthesized price timeline (e.g. [retail, mid, lowest, current]). */
  prices: number[];
  /** The lowest price ever — used to highlight the min point. */
  lowest?: number;
  /** The current price — used to highlight the latest point. */
  current?: number;
  /** Width of the sparkline viewBox (height is fixed small). */
  width?: number;
  height?: number;
  className?: string;
  /** Optional gradient id suffix to avoid SVG id collisions when multiple sparklines render. */
  idSuffix?: string;
}

/**
 * Compact, zero-dependency SVG sparkline used inside wishlist drawer rows.
 * Renders a smooth area+line chart with min/max markers in ~48px tall.
 * All motion is CSS @keyframes (spark-draw, ring-expand).
 */
export function MiniSparkline({
  prices,
  lowest,
  current,
  width = 80,
  height = 28,
  className,
  idSuffix = '',
}: MiniSparklineProps) {
  const gid = `mini-spark-${idSuffix || Math.random().toString(36).slice(2, 8)}`;
  const validPrices = prices.filter((p) => p > 0);
  if (validPrices.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        role="img"
        aria-label="Not enough price history"
      />
    );
  }

  const pad = 3;
  const min = Math.min(...validPrices, lowest ?? Infinity);
  const max = Math.max(...validPrices);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (validPrices.length - 1);
  const y = (price: number) => height - pad - ((price - min) / range) * (height - pad * 2);

  const coords = validPrices.map((p, i) => ({
    x: pad + i * stepX,
    y: y(p),
    price: p,
  }));

  // Smooth path (Catmull-Rom → Bézier)
  let linePath = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`;

  const lowestIndex = lowest ? coords.findIndex((c) => Math.abs(c.price - lowest) < 0.01) : -1;
  const currentIndex = current ? coords.findIndex((c) => Math.abs(c.price - current) < 0.01) : -1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: '100%' }}
      role="img"
      aria-label="Price trend sparkline"
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.7 0.2 300)" />
          <stop offset="50%" stopColor="oklch(0.78 0.2 145)" />
          <stop offset="100%" stopColor="oklch(0.78 0.16 70)" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gid}-fill)`} className="animate-fade-in" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${gid}-line)`}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: 200,
          animation: 'spark-draw 1s ease-out forwards',
        }}
      />

      {/* Lowest-ever marker (amber) */}
      {lowestIndex >= 0 && (
        <circle
          cx={coords[lowestIndex].x}
          cy={coords[lowestIndex].y}
          r="1.8"
          className="fill-hot"
        />
      )}

      {/* Current price marker (emerald) */}
      {currentIndex >= 0 && (
        <>
          <circle
            cx={coords[currentIndex].x}
            cy={coords[currentIndex].y}
            r="2"
            className="fill-primary"
          />
          <circle
            cx={coords[currentIndex].x}
            cy={coords[currentIndex].y}
            r="2"
            fill="none"
            stroke="oklch(0.78 0.2 145)"
            strokeWidth="0.4"
            className="animate-ring-expand"
            style={{
              transformOrigin: `${coords[currentIndex].x}px ${coords[currentIndex].y}px`,
            }}
          />
        </>
      )}
    </svg>
  );
}

/**
 * Build a synthesized price-history timeline for a wishlist item:
 *   [retail, mid, lowest-ever, current]
 * Used because CheapShark has no dedicated per-deal history endpoint we
 * can poll cheaply; the values come from the wishlist record itself.
 */
export function synthesizePriceTimeline(
  normalPrice: number,
  salePrice: number,
  lowestPrice?: number
): number[] {
  const retail = normalPrice > 0 ? normalPrice : salePrice * 2;
  const mid = (retail + salePrice) / 2;
  const lowest =
    lowestPrice !== undefined && lowestPrice > 0 ? Math.min(lowestPrice, salePrice) : salePrice;
  return [retail, mid, lowest, salePrice];
}
