/**
 * Discord webhook helper — raw fetch, zero deps.
 * Env: DISCORD_WEBHOOK_URL.
 * ponytail: full discord.js adds megabytes; one webhook POST covers flash-deal posts.
 */

const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 8_000;

export interface DiscordEmbed {
  title: string;
  url: string;
  description?: string;
  color?: number;
  image?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
}

/**
 * POST an embed to the configured Discord webhook. Best-effort: never throws.
 */
export async function postDiscordEmbed(embed: DiscordEmbed): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok || res.status === 204) return true;
    } catch {
      // retry once on network error/abort
    }
  }
  return false;
}
