import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = vi.fn((_max: number, _interval: string) => ({}));
    limit = mockLimit;
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {},
}));

const mockExecute = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: mockExecute,
    transaction: mockTransaction,
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    })),
    { raw: vi.fn((s: string) => s) }
  ),
}));

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    // Reset module-level state by re-importing
    vi.resetModules();
  });

  async function importFresh() {
    const mod = await import('@/lib/rate-limit');
    return mod.rateLimit;
  }

  it('returns true when Upstash allows the request', async () => {
    mockLimit.mockResolvedValue({ success: true });

    const rateLimit = await importFresh();
    const result = await rateLimit('auth:127.0.0.1', 10, 60_000);

    expect(result).toBe(true);
    expect(mockLimit).toHaveBeenCalledWith('auth:127.0.0.1');
  });

  it('returns false when Upstash rate-limits the request', async () => {
    mockLimit.mockResolvedValue({ success: false });

    const rateLimit = await importFresh();
    const result = await rateLimit('auth:127.0.0.1', 10, 60_000);

    expect(result).toBe(false);
    expect(mockLimit).toHaveBeenCalledWith('auth:127.0.0.1');
  });

  it('falls back to PostgreSQL when Upstash throws', async () => {
    mockLimit.mockRejectedValue(new Error('Connection refused'));

    const mockRows = [{ count: 3 }];
    const mockTx = {
      execute: vi.fn().mockResolvedValue(mockRows),
    };
    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx)
    );

    const rateLimit = await importFresh();
    const result = await rateLimit('auth:10.0.0.1', 10, 60_000);

    expect(result).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
  });

  it('PostgreSQL fallback returns false when count exceeds limit', async () => {
    mockLimit.mockRejectedValue(new Error('Timeout'));

    const mockRows = [{ count: 11 }];
    const mockTx = {
      execute: vi.fn().mockResolvedValue(mockRows),
    };
    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx)
    );

    const rateLimit = await importFresh();
    const result = await rateLimit('auth:10.0.0.1', 10, 60_000);

    expect(result).toBe(false);
  });

  it('falls back to PostgreSQL when Upstash env vars are missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const mockRows = [{ count: 1 }];
    const mockTx = {
      execute: vi.fn().mockResolvedValue(mockRows),
    };
    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx)
    );

    const rateLimit = await importFresh();
    const result = await rateLimit('auth:10.0.0.1', 10, 60_000);

    expect(result).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});
