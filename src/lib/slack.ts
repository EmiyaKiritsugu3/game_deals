/**
 * Slack webhook helper — raw fetch, zero deps.
 * Env: SLACK_WEBHOOK_URL. Best-effort: never throws.
 * ponytail: @slack/webhook-sdk unnecessary for one Incoming Webhook POST.
 */

const TIMEOUT_MS = 8_000;

export async function postSlackMessage(text: string): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
