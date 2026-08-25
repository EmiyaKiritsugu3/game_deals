import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendError, sendEmail } from './resend';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM_EMAIL = 'test@gamedeals.com.br';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
});

describe('sendEmail', () => {
  const input = { to: 'x@y.com', subject: 'S', html: '<p>hi</p>' };

  it('returns id on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc123' }), { status: 200 })
    );
    const result = await sendEmail(input);
    expect(result.id).toBe('abc123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws fast on 4xx without retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response('invalid api key', { status: 401 }));
    await expect(sendEmail(input)).rejects.toThrow(ResendError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry
  });

  it('retries on 5xx then succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'ok' }), { status: 200 }));
    const result = await sendEmail(input);
    expect(result.id).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries on persistent 5xx', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 503 }));
    await expect(sendEmail(input)).rejects.toThrow(ResendError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws when env not configured', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendEmail(input)).rejects.toThrow('Resend not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on empty input fields', async () => {
    await expect(sendEmail({ to: '', subject: 'S', html: '<p>hi</p>' })).rejects.toThrow(
      'Invalid email input'
    );
  });
});
