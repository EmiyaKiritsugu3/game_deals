'use client';

import * as Icons from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS, useAchievements } from '@/store/achievements';

const ACCENT_CLS: Record<string, { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary/15', text: 'text-primary', ring: 'ring-primary/30' },
  hot: { bg: 'bg-hot/15', text: 'text-hot', ring: 'ring-hot/30' },
  fuchsia: { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-300', ring: 'ring-fuchsia-400/30' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-400/30' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', ring: 'ring-cyan-400/30' },
};

/**
 * Celebratory toast that pops in when an achievement unlocks. Auto-dismisses
 * after 5 seconds. Renders confetti particles for extra delight.
 *
 * Reads `lastUnlocked` from the achievements store and clears it after display.
 */
export function AchievementToast() {
  const lastUnlocked = useAchievements((s) => s.lastUnlocked);
  const clearLastUnlocked = useAchievements((s) => s.clearLastUnlocked);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!lastUnlocked) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      // Allow fade-out animation before clearing
      setTimeout(clearLastUnlocked, 400);
    }, 5000);
    return () => clearTimeout(t);
  }, [lastUnlocked, clearLastUnlocked]);

  if (!lastUnlocked) return null;

  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      lastUnlocked.icon
    ] ?? Icons.Award;
  const accent = ACCENT_CLS[lastUnlocked.accent] ?? ACCENT_CLS.primary;

  return (
    <div
      className={cn(
        'fixed left-1/2 top-20 z-[70] -translate-x-1/2 transition-all duration-400',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border glass-strong p-0.5 shadow-2xl shadow-black/40',
          accent.ring,
          'ring-1'
        )}
      >
        {/* Confetti particles */}
        {visible && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => {
              const colors = [
                'oklch(0.78 0.2 145)',
                'oklch(0.78 0.16 70)',
                'oklch(0.7 0.2 300)',
                'oklch(0.7 0.2 200)',
                'oklch(0.92 0.16 70)',
              ];
              const color = colors[i % colors.length];
              return (
                <span /* biome-ignore lint/suspicious/noArrayIndexKey: static confetti items */
                  key={i}
                  className="animate-confetti-fall absolute top-0 size-1.5 rounded-sm"
                  style={{
                    left: `${8 + i * 7}%`,
                    background: color,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="relative flex items-center gap-3 rounded-[14px] bg-card/80 px-4 py-3 backdrop-blur-xl">
          <span
            className={cn(
              'relative grid size-12 shrink-0 place-items-center rounded-xl',
              accent.bg,
              accent.text
            )}
          >
            <span
              className="absolute inset-0 animate-ping rounded-xl opacity-30"
              style={{ background: 'currentColor' }}
            />
            <Icon className="size-6 relative" />
          </span>
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Achievement Unlocked
            </p>
            <p className="truncate text-sm font-bold leading-tight">{lastUnlocked.title}</p>
            <p className="truncate text-xs text-muted-foreground">{lastUnlocked.description}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-1 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-400">
              Points
            </p>
            <p className="font-mono text-sm font-bold text-amber-300">+{lastUnlocked.points}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating button + slide-out panel showing all achievements with progress.
 * Mounts at the bottom-left, above the price-drop alerts.
 */
export function AchievementsPanel() {
  const panelOpen = useAchievements((s) => s.panelOpen);
  const setPanelOpen = useAchievements((s) => s.setPanelOpen);
  const progress = useAchievements((s) => s.progress);
  const totalPoints = useAchievements((s) => s.totalPoints);

  const allProgress = ACHIEVEMENTS.map((a) => ({
    ...a,
    count: progress[a.id]?.count ?? 0,
    unlocked: progress[a.id]?.unlocked ?? false,
  }));
  const unlockedCount = allProgress.filter((a) => a.unlocked).length;

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="group fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-border/60 glass-strong px-3 py-2 shadow-lg shadow-black/30 backdrop-blur-md transition-all hover:border-amber-400/50 hover:shadow-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
        aria-label={`Achievements: ${unlockedCount} of ${ACHIEVEMENTS.length} unlocked, ${totalPoints} points`}
        aria-expanded={panelOpen}
      >
        <span className="relative grid size-7 place-items-center rounded-full bg-amber-500/15 text-amber-400">
          <Icons.Trophy className="size-4" />
          {unlockedCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black shadow">
              {unlockedCount}
            </span>
          )}
        </span>
        <span className="hidden text-xs font-semibold sm:inline">{totalPoints} pts</span>
      </button>

      {/* Slide-out panel */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close achievements"
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          />
          {/* Panel */}
          <aside
            className="fixed bottom-0 left-0 top-16 z-50 w-full max-w-sm animate-fade-in-up overflow-hidden border-r border-border/60 glass-strong shadow-2xl shadow-black/50"
            role="dialog"
            aria-label="Achievements"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                    <Icons.Trophy className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">Achievements</h2>
                    <p className="text-[10px] text-muted-foreground">
                      {unlockedCount} / {ACHIEVEMENTS.length} unlocked · {totalPoints} pts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
                  aria-label="Close"
                >
                  <Icons.X className="size-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="border-b border-border/40 px-4 py-3">
                <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                    style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Achievement list */}
              <div className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-2">
                  {allProgress.map((ach) => {
                    const Icon =
                      (
                        Icons as unknown as Record<
                          string,
                          React.ComponentType<{ className?: string }>
                        >
                      )[ach.icon] ?? Icons.Award;
                    const accent = ACCENT_CLS[ach.accent] ?? ACCENT_CLS.primary;
                    return (
                      <li
                        key={ach.id}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-2.5 transition-all',
                          ach.unlocked
                            ? cn('border-amber-400/30 bg-amber-500/5', accent.ring, 'ring-1')
                            : 'border-border/40 bg-card/30'
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-lg transition-all',
                            ach.unlocked
                              ? cn(accent.bg, accent.text)
                              : 'bg-muted/40 text-muted-foreground/40 grayscale'
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm font-semibold',
                              !ach.unlocked && 'text-muted-foreground'
                            )}
                          >
                            {ach.title}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {ach.description}
                          </p>
                          {/* Mini progress bar */}
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-border/40">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                ach.unlocked
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                  : 'bg-primary/50'
                              )}
                              style={{ width: `${Math.min(100, (ach.count / ach.goal) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {ach.unlocked ? (
                            <Icons.CheckCircle2 className="size-5 text-amber-400" />
                          ) : (
                            <p className="text-[10px] font-medium text-muted-foreground">
                              {ach.count}/{ach.goal}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
