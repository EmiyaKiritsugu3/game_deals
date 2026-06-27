interface GameStatsRowProps {
  readonly bestCurrentPrice: number;
  readonly isFree: boolean;
  readonly bestRawPrice: string;
  readonly cheapestEver: number;
  readonly isCurrentlyAtHL: boolean;
}

export default function GameStatsRow({
  bestCurrentPrice,
  isFree,
  bestRawPrice,
  cheapestEver,
  isCurrentlyAtHL,
}: GameStatsRowProps) {
  return (
    <div className="flex items-stretch bg-card border border-border rounded-[var(--radius)] overflow-hidden w-fit">
      <div className="flex flex-col gap-1 px-6 py-4">
        <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold">
          Best Price Now
        </span>
        <span className="text-[1.75rem] font-extrabold text-foreground leading-none flex items-center gap-2">
          {bestCurrentPrice === 0 || isFree ? (
            <span className="text-primary text-2xl">FREE</span>
          ) : (
            `$${bestRawPrice}`
          )}
        </span>
      </div>
      <div className="w-px bg-border shrink-0" />
      <div className="flex flex-col gap-1 px-6 py-4">
        <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold">
          Historical Low
        </span>
        <span className="text-[1.75rem] font-extrabold text-primary leading-none flex items-center gap-2">
          ${cheapestEver.toFixed(2)}
          {isCurrentlyAtHL && (
            <span className="bg-[var(--accent-hl)] text-[var(--accent-hl-foreground)] text-[0.55rem] font-extrabold px-[0.15rem] py-[0.1rem] rounded-sm tracking-wider animate-[pulse_2s_ease-in-out_infinite]">
              LIVE HL
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
