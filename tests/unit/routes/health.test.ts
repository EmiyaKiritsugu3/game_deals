import { describe, expect, it, vi } from 'vitest';

const execute = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('@/db', () => ({ db: { execute } }));
const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', fetchMock);

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('200 with all components ok', async () => {
    execute.mockResolvedValueOnce([]);
    fetchMock
      .mockResolvedValueOnce({ ok: true }) // CheapShark HEAD
      .mockResolvedValueOnce({ ok: true }); // Typesense ping
    const res = await GET();
    const body = (await res.json()) as Record<string, string>;
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'ok', db: 'ok', cheapshark: 'ok', typesense: 'ok' });
    expect(typeof body.ts).toBe('string');
  });

  it('200 degraded when CheapShark down', async () => {
    execute.mockResolvedValueOnce([]);
    fetchMock
      .mockRejectedValueOnce(new Error('timeout')) // CheapShark
      .mockResolvedValueOnce({ ok: true }); // Typesense
    const res = await GET();
    const body = (await res.json()) as Record<string, string>;
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'degraded', db: 'ok', cheapshark: 'error' });
  });

  it('200 degraded when Typesense unreachable', async () => {
    execute.mockResolvedValueOnce([]);
    fetchMock
      .mockResolvedValueOnce({ ok: true }) // CheapShark
      .mockResolvedValueOnce({ ok: false, status: 500 }); // Typesense
    const res = await GET();
    const body = (await res.json()) as Record<string, string>;
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'degraded', typesense: 'error' });
  });

  it('503 when DB down even if deps ok', async () => {
    execute.mockRejectedValueOnce(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, string>;
    expect(body).toMatchObject({ status: 'degraded', db: 'error' });
  });
});
