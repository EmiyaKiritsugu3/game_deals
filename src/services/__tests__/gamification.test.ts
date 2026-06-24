import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Helpers ---

function assertNonNull<T>(value: T): asserts value is NonNullable<T> {
  expect(value).not.toBeNull();
}

// --- Mocks ---

const { mockDb, mockExecute, mockInsert, mockSelect } = vi.hoisted(() => {
  const mockExecute = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  return {
    mockDb: { insert: mockInsert, select: mockSelect, execute: mockExecute },
    mockExecute,
    mockInsert,
    mockSelect,
  };
});

vi.mock('@/db', () => ({ db: mockDb }));

// --- Helpers ---

interface ChainOptions {
  /** Ordered list of data each `where` / `innerJoin().where()` should resolve to. */
  whereData?: unknown[][];
}

/**
 * Configure select chain so that each terminal operator returns data from the queue.
 * The `.from()` call creates a fresh `where` mock that reads from a shared index.
 */
function setupSelect(opts: ChainOptions = {}) {
  const queue = [...(opts.whereData ?? [])];
  let index = 0;

  // Promise + chainable wrapper
  const result = (data: unknown) => {
    const p = Promise.resolve(data) as Promise<unknown> & {
      orderBy: () => ReturnType<typeof result>;
      limit: () => ReturnType<typeof result>;
    };
    p.orderBy = () => result(data);
    p.limit = () => result(data);
    return p;
  };

  const where = vi.fn(() => result(queue[index++] ?? []));
  const innerJoin = vi.fn(() => ({ where }));

  mockSelect.mockReturnValue({
    from: vi.fn(() => ({ where, innerJoin })),
  });

  return { where, innerJoin, queue, next: () => queue[index] };
}

/** Configure insert chain — returns chainable mock objects. */
function setupInsert() {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate, onConflictDoNothing }));

  mockInsert.mockReturnValue({ values });
  return { onConflictDoUpdate, onConflictDoNothing, values };
}

// --- SUT ---

import { activities, userStats } from '@/db/schema';
import {
  calcLevel,
  getLeaderboard,
  getUserProfile,
  processAction,
  seedBadges,
} from '../gamification';

// --- Tests ---

describe('calcLevel', () => {
  it('returns 0 for xp = 0', () => {
    expect(calcLevel(0)).toBe(0);
  });

  it('returns 1 for xp = 10', () => {
    expect(calcLevel(10)).toBe(1);
  });

  it('returns 2 for xp = 40', () => {
    expect(calcLevel(40)).toBe(2);
  });

  it('returns 3 for xp = 90', () => {
    expect(calcLevel(90)).toBe(3);
  });

  it('returns 31 for xp = 10000', () => {
    expect(calcLevel(10000)).toBe(31);
  });
});

describe('processAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts activity and upserts user_stats', async () => {
    setupInsert();
    setupSelect({
      whereData: [[{ xp: 5 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }], []],
    });

    const result = await processAction('user-1', 'wishlist_add');

    // Activity insert
    expect(mockInsert).toHaveBeenCalledWith(activities);
    // UserStats upsert
    expect(mockInsert).toHaveBeenCalledWith(userStats);

    assertNonNull(result);
    expect(result.xpGained).toBe(5);
    expect(result.xpTotal).toBe(5);
    expect(result.newBadges).toEqual([]);
    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(0);
  });

  it('earns badge when activity count meets threshold', async () => {
    setupInsert();
    setupSelect({
      whereData: [[{ xp: 10 }], [{ count: 1 }], [{ count: 1 }], [{ count: 0 }], []],
    });
    mockExecute.mockResolvedValue([{ award_badge: 'uuid-1' }]);

    const result = await processAction('user-1', 'wishlist_add');

    assertNonNull(result);
    expect(result.newBadges).toHaveLength(1);
    expect(result.newBadges[0].name).toBe('First Wish');
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({}));
  });

  it('returns null when db throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockImplementation(() => {
      throw new Error('DB down');
    });

    const result = await processAction('user-1', 'wishlist_add');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles duplicate badge gracefully', async () => {
    setupInsert();
    setupSelect({
      whereData: [[{ xp: 10 }], [{ count: 1 }], [{ count: 1 }], [{ count: 0 }], []],
    });

    // First execute call succeeds, second fails (simulating duplicate)
    mockExecute
      .mockResolvedValueOnce([{ award_badge: 'uuid-1' }])
      .mockRejectedValueOnce(new Error('duplicate key'));

    const result = await processAction('user-1', 'wishlist_add');

    assertNonNull(result);
    expect(result.newBadges).toHaveLength(1);
    // Should still return successfully with the badge that was earned
    expect(result.newBadges[0].name).toBe('First Wish');
  });
});

describe('seedBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts badge definitions idempotently', async () => {
    const { onConflictDoNothing } = setupInsert();

    await seedBadges();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(onConflictDoNothing).toHaveBeenCalled();
  });

  it('does not throw on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockImplementation(() => {
      throw new Error('constraint violation');
    });

    await expect(seedBadges()).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stats badges and recent activity', async () => {
    setupSelect({
      whereData: [
        [{ xp: 100, optInLeaderboard: true }],
        [
          {
            id: 'b1',
            name: 'First Wish',
            description: null,
            iconSvg: '<svg/>',
            rarity: 'Common',
            awardedAt: new Date(),
          },
        ],
        [{ id: 'a1', actionType: 'wishlist_add', details: null, createdAt: new Date() }],
      ],
    });

    const result = await getUserProfile('user-1');

    assertNonNull(result);
    expect(result.stats.xp).toBe(100);
    expect(result.stats.level).toBe(3);
    expect(result.badges).toHaveLength(1);
    expect(result.recentActivity).toHaveLength(1);
  });

  it('handles missing stats row', async () => {
    setupSelect({
      whereData: [[], [], []],
    });

    const result = await getUserProfile('user-1');

    assertNonNull(result);
    expect(result.stats.xp).toBe(0);
    expect(result.stats.level).toBe(0);
    expect(result.badges).toEqual([]);
    expect(result.recentActivity).toEqual([]);
  });

  it('returns null on db error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelect.mockImplementation(() => {
      throw new Error('db error');
    });

    const result = await getUserProfile('user-1');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns leaderboard entries ordered by xp desc', async () => {
    const leaderboardData = [
      { userId: 'u1', xp: 200, badgeCount: 5 },
      { userId: 'u2', xp: 100, badgeCount: 2 },
    ];

    mockSelect.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue(leaderboardData),
          })),
        })),
      })),
    });

    const result = await getLeaderboard(10);

    assertNonNull(result);
    expect(result).toHaveLength(2);
    expect(result[0].xp).toBe(200);
    expect(result[1].xp).toBe(100);
  });

  it('returns null on db error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelect.mockImplementation(() => {
      throw new Error('db error');
    });

    const result = await getLeaderboard();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
