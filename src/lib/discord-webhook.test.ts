import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postDiscordEmbed } from './discord-webhook';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DISCORD_WEBHOOK_URL;
});

describe('postDiscordEmbed', () => {
  const embed = {
    title: 'Test deal',
    url: 'https://gamedeals.com.br/game/123',
    description: '-50%',
  };

  it('returns false when webhook not configured', async () => {
    const ok = await postDiscordEmbed(embed);
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns true on 204', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/x/y';
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const ok = await postDiscordEmbed(embed);
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on network error then succeeds', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/x/y';
    fetchMock
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const ok = await postDiscordEmbed(embed);
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns false after retries exhausted', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/x/y';
    fetchMock.mockRejectedValue(new Error('net'));
    const ok = await postDiscordEmbed(embed);
    expect(ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
