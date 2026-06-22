import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({ db: {} }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockCaptureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}));

describe('searchGamesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs warning and captures in Sentry when CheapShark returns non-OK', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve([]),
    });

    const originalKey = process.env.TYPESENSE_ADMIN_KEY;
    delete process.env.TYPESENSE_ADMIN_KEY;
    delete process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;

    const { searchGamesAction } = await import('@/actions/search');
    const result = await searchGamesAction('test', 5);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('CheapShark search failed: HTTP 429');
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('429') })
    );

    if (originalKey) process.env.TYPESENSE_ADMIN_KEY = originalKey;
    consoleSpy.mockRestore();
  });
});
