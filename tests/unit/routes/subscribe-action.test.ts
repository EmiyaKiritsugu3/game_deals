import { beforeEach, describe, expect, it, vi } from 'vitest';

const chain = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('@/db', () => ({ db: chain }));
const sendEmail = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/resend')>();
  return { ...actual, sendEmail };
});
const assertRateLimit = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@/lib/server-action-rate-limit', () => ({ assertRateLimit }));

import { subscribeAction } from '@/actions/subscribe';

function formData(email: string): FormData {
  const fd = new FormData();
  fd.set('email', email);
  return fd;
}

function selectReturning(rows: unknown[]) {
  chain.select.mockReturnValue({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  });
}

beforeEach(() => {
  chain.select.mockReset();
  chain.insert.mockReset();
  sendEmail.mockReset().mockResolvedValue({ id: 'x' });
});

describe('subscribeAction', () => {
  it('rejects invalid email without DB or email calls', async () => {
    const result = await subscribeAction(null, formData('nope'));
    expect(result.ok).toBe(false);
    expect(chain.select).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('short-circuits when already active', async () => {
    selectReturning([{ status: 'active' }]);
    const result = await subscribeAction(null, formData('a@b.com'));
    expect(result.ok).toBe(true);
    expect(result.message).toContain('já está inscrito');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('re-sends confirmation for pending subscriber', async () => {
    selectReturning([{ status: 'pending', confirmToken: 'tok' }]);
    const result = await subscribeAction(null, formData('a@b.com'));
    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(String(sendEmail.mock.calls[0]?.[0]?.html)).toContain('token=tok');
  });

  it('inserts new subscriber and sends confirm link', async () => {
    selectReturning([]);
    chain.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([{ id: 'r1', confirmToken: 'tok-new' }]) }),
    });
    const result = await subscribeAction(null, formData('new@b.com'));
    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(String(sendEmail.mock.calls[0]?.[0]?.html)).toContain('token=tok-new');
  });

  it('returns friendly message on ResendError', async () => {
    selectReturning([]);
    chain.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([{ id: 'r1', confirmToken: 't' }]) }),
    });
    const { ResendError } = await import('@/lib/resend');
    sendEmail.mockRejectedValueOnce(new ResendError('quota', 429));
    const result = await subscribeAction(null, formData('a@b.com'));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Não foi possível enviar');
  });
});
