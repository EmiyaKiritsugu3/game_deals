interface LevelBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
}

export default function LevelBadge({ level, xp, xpToNext }: LevelBadgeProps) {
  const xpForCurrentLevel = level * level * 10;
  const xpIntoLevel = xp - xpForCurrentLevel;
  const percent = xpToNext > 0 ? (xpIntoLevel / xpToNext) * 100 : 100;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-xl font-bold"
        role="img"
        aria-label={`Level ${level}`}
      >
        {level}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Level {level}</p>
        <div className="mt-1 h-2 w-full rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {xpIntoLevel} / {xpToNext} XP to next level
        </p>
      </div>
    </div>
  );
}
