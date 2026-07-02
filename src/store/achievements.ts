'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  /** Goal value to unlock */
  goal: number;
  /** Optional accent color for the badge */
  accent: 'primary' | 'hot' | 'amber';
  /** Points awarded (for total score) */
  points: number;
}

interface AchievementProgress {
  /** Current count toward the goal */
  count: number;
  /** Whether the achievement has been unlocked */
  unlocked: boolean;
  /** ISO timestamp when unlocked */
  unlockedAt?: string;
}

interface AchievementState {
  /** Map of achievementId → progress */
  progress: Record<string, AchievementProgress>;
  /** Total achievement points earned */
  totalPoints: number;
  /** Recently unlocked achievement (for toast notifications). Cleared after display. */
  lastUnlocked: Achievement | null;
  /** Number of distinct days the user has visited (computed from lastVisit dates) */
  visitDays: string[]; // ISO date strings (YYYY-MM-DD)
  /** Whether the achievements panel is open */
  panelOpen: boolean;

  increment: (achievementId: string, by?: number) => void;
  setCount: (achievementId: string, count: number) => void;
  recordVisit: () => void;
  clearLastUnlocked: () => void;
  setPanelOpen: (open: boolean) => void;
  resetAll: () => void;
}

/** All achievements, defined statically. */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-wishlist',
    title: 'First Save',
    description: 'Add your first game to the wishlist',
    icon: 'Heart',
    goal: 1,
    accent: 'primary',
    points: 10,
  },
  {
    id: 'wishlist-5',
    title: 'Deal Hunter',
    description: 'Save 5 games to your wishlist',
    icon: 'Bookmark',
    goal: 5,
    accent: 'primary',
    points: 25,
  },
  {
    id: 'wishlist-25',
    title: 'Collector',
    description: 'Save 25 games to your wishlist',
    icon: 'Archive',
    goal: 25,
    accent: 'amber',
    points: 75,
  },
  {
    id: 'compare-1',
    title: 'Smart Shopper',
    description: 'Compare 2 deals side-by-side',
    icon: 'GitCompare',
    goal: 1,
    accent: 'hot',
    points: 15,
  },
  {
    id: 'compare-3',
    title: 'Pro Comparator',
    description: 'Compare 3 deals at once (the maximum)',
    icon: 'Layers',
    goal: 3,
    accent: 'hot',
    points: 40,
  },
  {
    id: 'free-claimer',
    title: 'Free Loader',
    description: 'Add a free game to your wishlist',
    icon: 'Gift',
    goal: 1,
    accent: 'hot',
    points: 20,
  },
  {
    id: 'free-5',
    title: 'Giveaway Guru',
    description: 'Add 5 free games to your wishlist',
    icon: 'Gift',
    goal: 5,
    accent: 'hot',
    points: 60,
  },
  {
    id: 'visitor-3',
    title: 'Regular',
    description: 'Visit DEALFORGE on 3 different days',
    icon: 'Calendar',
    goal: 3,
    accent: 'hot', // ponytail: was cyan; mapped to hot per One Voice Rule
    points: 30,
  },
  {
    id: 'visitor-7',
    title: 'Loyal Gamer',
    description: 'Visit DEALFORGE on 7 different days',
    icon: 'CalendarCheck',
    goal: 7,
    accent: 'amber',
    points: 100,
  },
  {
    id: 'detail-explorer',
    title: 'Detail Oriented',
    description: 'Open 10 deal detail dialogs',
    icon: 'Search',
    goal: 10,
    accent: 'primary',
    points: 35,
  },
];

/** Helper to get all achievements with their current progress merged in. */
export function getAchievementProgress(
  state: Pick<AchievementState, 'progress'>
): Array<Achievement & AchievementProgress> {
  return ACHIEVEMENTS.map((a) => {
    const p = state.progress[a.id] ?? { count: 0, unlocked: false };
    return { ...a, ...p };
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useAchievements = create<AchievementState>()(
  persist(
    (set, get) => ({
      progress: {},
      totalPoints: 0,
      lastUnlocked: null,
      visitDays: [],
      panelOpen: false,

      increment: (achievementId, by = 1) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!ach) return;
        const current = get().progress[achievementId] ?? {
          count: 0,
          unlocked: false,
        };
        if (current.unlocked) return; // already unlocked — no-op
        const newCount = Math.min(current.count + by, ach.goal);
        const newlyUnlocked = newCount >= ach.goal;
        set((s) => {
          const updatedProgress = {
            ...s.progress,
            [achievementId]: {
              count: newCount,
              unlocked: newlyUnlocked,
              unlockedAt: newlyUnlocked ? new Date().toISOString() : current.unlockedAt,
            },
          };
          return {
            progress: updatedProgress,
            totalPoints: newlyUnlocked ? s.totalPoints + ach.points : s.totalPoints,
            lastUnlocked: newlyUnlocked ? ach : s.lastUnlocked,
          };
        });
      },

      setCount: (achievementId, count) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!ach) return;
        const current = get().progress[achievementId] ?? {
          count: 0,
          unlocked: false,
        };
        if (current.unlocked) return;
        const clampedCount = Math.min(Math.max(0, count), ach.goal);
        const newlyUnlocked = clampedCount >= ach.goal;
        set((s) => ({
          progress: {
            ...s.progress,
            [achievementId]: {
              count: clampedCount,
              unlocked: newlyUnlocked,
              unlockedAt: newlyUnlocked ? new Date().toISOString() : current.unlockedAt,
            },
          },
          totalPoints: newlyUnlocked ? s.totalPoints + ach.points : s.totalPoints,
          lastUnlocked: newlyUnlocked ? ach : s.lastUnlocked,
        }));
      },

      recordVisit: () => {
        const today = todayIso();
        const days = get().visitDays;
        if (days.includes(today)) return;
        const newDays = [...days, today].slice(-30); // keep last 30 days
        set({ visitDays: newDays });
        // Increment visit-based achievements
        get().setCount('visitor-3', newDays.length);
        get().setCount('visitor-7', newDays.length);
      },

      clearLastUnlocked: () => set({ lastUnlocked: null }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      resetAll: () =>
        set({
          progress: {},
          totalPoints: 0,
          lastUnlocked: null,
          visitDays: [],
          panelOpen: false,
        }),
    }),
    {
      name: 'dealforge-achievements',
    }
  )
);
