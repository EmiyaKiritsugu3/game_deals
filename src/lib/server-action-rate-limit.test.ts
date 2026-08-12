import { beforeEach, describe, expect, it, vi } from 'vitest';

// Override the global no-op mock from tests/setup.ts so real code runs here.
vi.unmock('@/lib/server-action-rate-limit');

// vi.hoisted factories are hoisted alongside vi.mock, so these fns exist
// at the time vi.mock factories run.
const { mockHeadersGet, mockRateLimit } = vi.hoisted(() => ({
  mockHeadersGet: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: mockHeadersGet }),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
}));

// static import after hoisted mocks
import { assertRateLimit } from './server-action-rate-limit';

describe('assertRateLimit', () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    mockRateLimit.mockReset();
    mockHeadersGet.mockReturnValue('203.0.113.5, 10.0.0.1');
    mockRateLimit.mockResolvedValue(true);
  });

  it('uses userId key when userId provided and allows when rateLimit returns true', async () => {
    await assertRateLimit('alertCreate', 'user-123', 10, 60_000);
    expect(mockRateLimit).toHaveBeenCalledWith('alertCreate:u:user-123', 10, 60_000);
  });

  it('uses ip key when userId null, parses x-forwarded-for first hop', async () => {
    await assertRateLimit('search', null, 30, 60_000);
    expect(mockRateLimit).toHaveBeenCalledWith('search:ip:203.0.113.5', 30, 60_000);
  });

  it('falls back to "unknown" ip when x-forwarded-for missing', async () => {
    mockHeadersGet.mockReturnValue(null);
    await assertRateLimit('search', null, 30, 60_000);
    expect(mockRateLimit).toHaveBeenCalledWith('search:ip:unknown', 30, 60_000);
  });

  it('throws "Rate limit exceeded" when rateLimit returns false', async () => {
    mockRateLimit.mockResolvedValue(false);
    await expect(assertRateLimit('alertCreate', 'user-123')).rejects.toThrow('Rate limit exceeded');
  });

  it('passes default maxAttempts and windowMs when omitted', async () => {
    await assertRateLimit('rateGame', 'user-1');
    expect(mockRateLimit).toHaveBeenCalledWith('rateGame:u:user-1', 10, 60_000);
  });
});
