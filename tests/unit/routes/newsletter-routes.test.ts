import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateChain, selectChain } = vi.hoisted(() => {
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return { updateChain, selectChain };
});

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(() => updateChain),
    select: vi.fn(() => ({ from: () => selectChain })),
  },
}));

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn().mockResolvedValue({ id: 'x' }) }));
vi.mock('@/lib/resend', () => ({ ResendError: class extends Error {}, sendEmail }));
vi.mock('@/lib/email-templates', () => ({
  welcomeEmail: () => ({ subject: 's', html: '<p>x</p>' }),
}));
const redirectSpy = vi.fn();
vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (...a: unknown[]) => redirectSpy(...a),
    json: (b: unknown, i?: unknown) => new Response(JSON.stringify(b), i as ResponseInit),
  },
}));

import { GET as confirmGET } from '@/app/api/subscribe/confirm/route';
import { GET as unsubGET } from '@/app/api/unsubscribe/route';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://gamedeals.com.br';
  updateChain.set.mockClear();
  updateChain.where.mockClear().mockResolvedValue([]);
  selectChain.limit.mockClear().mockResolvedValue([]);
  sendEmail.mockClear().mockResolvedValue({ id: 'x' });
  redirectSpy.mockReset();
});

describe('GET /api/unsubscribe', () => {
  it('rejects malformed token with 400', async () => {
    const res = await unsubGET(new Request('http://x/api/unsubscribe?token=not-a-uuid'));
    expect(res.status).toBe(400);
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it('marks subscriber unsubscribed for valid token', async () => {
    redirectSpy.mockReturnValueOnce(new Response(null, { status: 303 }));
    const token = crypto.randomUUID();
    await unsubGET(new Request(`http://x/api/unsubscribe?token=${token}`));
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'unsubscribed', unsubscribedAt: expect.any(Date) })
    );
    expect(redirectSpy).toHaveBeenCalled();
  });
});

describe('GET /api/subscribe/confirm', () => {
  it('rejects malformed token with 400', async () => {
    const res = await confirmGET(new Request('http://x/api/subscribe/confirm?token=x'));
    expect(res.status).toBe(400);
  });

  it('activates pending subscriber and sends welcome email', async () => {
    redirectSpy.mockReturnValueOnce(new Response(null, { status: 303 }));
    selectChain.limit.mockResolvedValueOnce([
      {
        id: 'row-1',
        email: 'user@example.com',
        status: 'pending',
        confirmToken: crypto.randomUUID(),
      },
    ]);
    await confirmGET(new Request(`http://x/api/subscribe/confirm?token=${crypto.randomUUID()}`));
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', confirmedAt: expect.any(Date) })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('does not re-send welcome email for already-active token', async () => {
    redirectSpy.mockReturnValueOnce(new Response(null, { status: 303 }));
    selectChain.limit.mockResolvedValueOnce([]); // query filters status='pending'
    await confirmGET(new Request(`http://x/api/subscribe/confirm?token=${crypto.randomUUID()}`));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('welcome email failure does not block confirmation', async () => {
    redirectSpy.mockReturnValueOnce(new Response(null, { status: 303 }));
    selectChain.limit.mockResolvedValueOnce([
      {
        id: 'row-1',
        email: 'user@example.com',
        status: 'pending',
        confirmToken: crypto.randomUUID(),
      },
    ]);
    sendEmail.mockRejectedValueOnce(new Error('resend down'));
    const res = await confirmGET(
      new Request(`http://x/api/subscribe/confirm?token=${crypto.randomUUID()}`)
    );
    expect(res.status).toBe(303);
  });
});
