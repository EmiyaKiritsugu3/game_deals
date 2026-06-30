'use client';

export interface SparklinePoint {
  label: string;
  price: number;
  highlight?: boolean;
}

interface PriceSparklineProps {
  points: SparklinePoint[];
  currentPrice?: number;
  cheapestEver?: number;
  height?: number;
  className?: string;
}

/**
 * Zero-dependency SVG sparkline. Renders a smooth area+line chart with
 * gradient fill, min/max markers, and a pulsing dot on the current price.
 * All motion is CSS @keyframes (no JS animation libraries).
 */
export function PriceSparkline({
  points,
  currentPrice,
  cheapestEver,
  height = 80,
  className,
}: PriceSparklineProps) {
  const width = 100; // viewBox width (scales responsively)
  const pad = 6;

  const prices = points.map((p) => p.price).filter((p) => p > 0);
  if (prices.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
        Not enough price history to chart yet.
      </div>
    );
  }

  const min = Math.min(...prices, cheapestEver ?? Infinity);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const stepX = (width - pad * 2) / (points.length - 1);
  const y = (price: number) => height - pad - ((price - min) / range) * (height - pad * 2);

  const coords = points.map((p, i) => ({
    x: pad + i * stepX,
    y: y(p.price),
    ...p,
  }));

  // Smooth path (Catmull-Rom → Bézier)
  const linePath = smoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`;

  const currentIndex = currentPrice
    ? coords.findIndex((c) => Math.abs(c.price - currentPrice) < 0.01)
    : -1;
  const cheapestIndex = coords.findIndex((c) => c.highlight);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-20 w-full overflow-visible"
        role="img"
        aria-label="Price history sparkline"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.7 0.2 300)" />
            <stop offset="50%" stopColor="oklch(0.78 0.2 145)" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 70)" />
          </linearGradient>
        </defs>

        {/* Baseline grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={width - pad}
            y1={pad + t * (height - pad * 2)}
            y2={pad + t * (height - pad * 2)}
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-muted-foreground/20"
            strokeDasharray="1 2"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#spark-fill)" className="animate-fade-in" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#spark-line)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 300,
            strokeDashoffset: 300,
            animation: 'spark-draw 1.2s ease-out forwards',
          }}
        />

        {/* Cheapest-ever marker */}
        {cheapestIndex >= 0 && (
          <g>
            <circle
              cx={coords[cheapestIndex].x}
              cy={coords[cheapestIndex].y}
              r="2.5"
              className="fill-hot"
            />
            <circle
              cx={coords[cheapestIndex].x}
              cy={coords[cheapestIndex].y}
              r="2.5"
              fill="none"
              stroke="oklch(0.78 0.16 70)"
              strokeWidth="0.5"
              className="animate-ring-expand"
              style={{
                transformOrigin: `${coords[cheapestIndex].x}px ${coords[cheapestIndex].y}px`,
              }}
            />
          </g>
        )}

        {/* Current price pulsing dot */}
        {currentIndex >= 0 && (
          <g>
            <circle
              cx={coords[currentIndex].x}
              cy={coords[currentIndex].y}
              r="3"
              className="fill-primary"
            />
            <circle
              cx={coords[currentIndex].x}
              cy={coords[currentIndex].y}
              r="3"
              fill="none"
              stroke="oklch(0.78 0.2 145)"
              strokeWidth="0.6"
              className="animate-ring-expand"
              style={{ transformOrigin: `${coords[currentIndex].x}px ${coords[currentIndex].y}px` }}
            />
          </g>
        )}
      </svg>

      {/* X-axis labels */}
      <div className="mt-1 flex justify-between px-1 text-[9px] text-muted-foreground">
        {points.map((p, i) => (
          <span
            key={i}
            className={
              i === 0 || i === points.length - 1 || p.highlight ? 'opacity-90' : 'opacity-40'
            }
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function smoothPath(coords: { x: number; y: number }[]) {
  if (coords.length < 2) return '';
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
