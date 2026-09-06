import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('@/db', () => ({ db: { execute } }));

const { requireAdmin, UnauthorizedError, ForbiddenError } = vi.hoisted(() => {
  class UnauthorizedError extends Error {}
  class ForbiddenError extends Error {}
  return { requireAdmin: vi.fn(), UnauthorizedError, ForbiddenError };
});
vi.mock('@/lib/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/require-user', () => ({ UnauthorizedError, ForbiddenError }));

import { GET } from '@/app/api/admin/revenue/export/route';

function req(period?: string): Request {
  const url = period
    ? `http://x/api/admin/revenue/export?period=${period}`
    : 'http://x/api/admin/revenue/export';
  return new Request(url);
}

function chunks(): string {
  const sqlArg = execute.mock.calls[0]?.[0] as { queryChunks?: unknown[] };
  return JSON.stringify(sqlArg.queryChunks ?? sqlArg);
}

beforeEach(() => {
  execute.mockClear();
  execute.mockResolvedValue([]);
  requireAdmin.mockReset().mockResolvedValue({ role: 'admin' });
});

describe('GET /api/admin/revenue/export', () => {
  it('401 when unauthenticated, DB untouched', async () => {
    requireAdmin.mockRejectedValueOnce(new UnauthorizedError());
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('403 when non-admin, DB untouched', async () => {
    requireAdmin.mockRejectedValueOnce(new ForbiddenError());
    const res = await GET(req());
    expect(res.status).toBe(403);
    expect(execute).not.toHaveBeenCalled();
  });

  it('defaults to 30d with CSV body + download headers', async () => {
    execute.mockResolvedValueOnce([
      { store_id: 'steam', clicks: 2, conversions: 1, revenue_cents: 150 },
    ]);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('revenue-30d.csv');
    await expect(res.text()).resolves.toBe(
      'store_id,clicks,conversions,revenue_cents\nsteam,2,1,150\n'
    );
    expect(chunks()).toContain('make_interval');
  });

  it('all period omits time filter', async () => {
    const res = await GET(req('all'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('revenue-all.csv');
    expect(chunks()).not.toContain('make_interval');
  });

  it('invalid period falls back to 30d', async () => {
    const res = await GET(req('HACKED'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('revenue-30d.csv');
    expect(chunks()).toContain('make_interval');
  });
});
