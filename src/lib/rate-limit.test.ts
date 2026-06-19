import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from './rate-limit';

const { mockTx, mockDbExecute } = vi.hoisted(() => ({
  mockTx: { execute: vi.fn() },
  mockDbExecute: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    execute: mockDbExecute,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.execute.mockReset();
  mockTx.execute.mockResolvedValue([{ count: 1 }]);
  mockDbExecute.mockReset();
  mockDbExecute.mockResolvedValue([]);
});

describe('rateLimit', () => {
  it('allows first call for a new key', async () => {
    mockTx.execute.mockResolvedValue([{ count: 1 }]);
    await expect(rateLimit('new-key')).resolves.toBe(true);
  });

  it('allows request when under the limit', async () => {
    mockTx.execute.mockResolvedValue([{ count: 3 }]);
    await expect(rateLimit('key', 10)).resolves.toBe(true);
  });

  it('allows request when exactly at the limit', async () => {
    mockTx.execute.mockResolvedValue([{ count: 10 }]);
    await expect(rateLimit('key', 10)).resolves.toBe(true);
  });

  it('blocks request when over the limit', async () => {
    mockTx.execute.mockResolvedValue([{ count: 11 }]);
    await expect(rateLimit('key', 10)).resolves.toBe(false);
  });

  it('blocks request when maxAttempts is 0', async () => {
    mockTx.execute.mockResolvedValue([{ count: 1 }]);
    await expect(rateLimit('key', 0)).resolves.toBe(false);
  });

  it('returns true when no rows are returned (guard clause)', async () => {
    mockTx.execute.mockResolvedValue([]);
    await expect(rateLimit('key')).resolves.toBe(true);
  });

  it('calls execute twice (advisory lock + upsert SQL)', async () => {
    await rateLimit('lock-test');
    expect(mockTx.execute).toHaveBeenCalledTimes(2);
  });
});
