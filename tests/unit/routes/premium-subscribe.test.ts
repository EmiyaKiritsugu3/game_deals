import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectChain } = vi.hoisted(() => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return { selectChain };
});

vi.mock('@/db', () => ({
  db: { select: vi.fn(() => ({ from: () => selectChain })) },
}));

const { getOptionalUser } = vi.hoisted(() => ({
  getOptionalUser: vi.fn<() => Promise<{ id: string } | null>>(),
}));
vi.mock('@/lib/require-user', () => ({ getOptionalUser }));

import { subscribeAction } from '@/actions/subscribe';
import { isPremium } from '@/lib/premium';

beforeEach(() => {
  selectChain.limit.mockReset().mockResolvedValue([]);
  getOptionalUser.mockReset();
});

describe('isPremium', () => {
  it('returns false for anonymous visitor', async () => {
    getOptionalUser.mockResolvedValueOnce(null);
    await expect(isPremium()).resolves.toBe(false);
  });

  it('returns false when premiumUntil is null', async () => {
    getOptionalUser.mockResolvedValueOnce({ id: 'u1' });
    selectChain.limit.mockResolvedValueOnce([{ premiumUntil: null }]);
    await expect(isPremium()).resolves.toBe(false);
  });

  it('returns true for active subscription', async () => {
    getOptionalUser.mockResolvedValueOnce({ id: 'u1' });
    selectChain.limit.mockResolvedValueOnce([{ premiumUntil: new Date(Date.now() + 86_400_000) }]);
    await expect(isPremium()).resolves.toBe(true);
  });

  it('returns false for expired subscription (date compare)', async () => {
    getOptionalUser.mockResolvedValueOnce({ id: 'u1' });
    selectChain.limit.mockResolvedValueOnce([{ premiumUntil: new Date(Date.now() - 86_400_000) }]);
    await expect(isPremium()).resolves.toBe(false);
  });
});

describe('subscribeAction', () => {
  function formData(email: string): FormData {
    const fd = new FormData();
    fd.set('email', email);
    return fd;
  }

  it('rejects invalid email without touching DB', async () => {
    const result = await subscribeAction(null, formData('not-an-email'));
    expect(result).toEqual({ ok: false, message: 'E-mail inválido.' });
  });

  it('rejects oversized email (>255 chars)', async () => {
    const result = await subscribeAction(null, formData(`${'a'.repeat(250)}@x.com`));
    expect(result.ok).toBe(false);
  });
});
