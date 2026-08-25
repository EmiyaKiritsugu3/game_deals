import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postSlackMessage } from './slack';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SLACK_WEBHOOK_URL;
});

describe('postSlackMessage', () => {
  it('returns false when webhook not configured', async () => {
    expect(await postSlackMessage('hi')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns true on ok response', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/x/y/z';
    fetchMock.mockResolvedValueOnce(new Response('ok', { status: 200 }));
    expect(await postSlackMessage('hi')).toBe(true);
  });

  it('returns false on network error (never throws)', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/x/y/z';
    fetchMock.mockRejectedValue(new Error('net'));
    await expect(postSlackMessage('hi')).resolves.toBe(false);
  });
});
