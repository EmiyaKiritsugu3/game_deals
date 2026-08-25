/**
 * Minimal Resend email client — raw fetch, zero deps.
 * ponytail: official SDK adds ~200KB for one POST endpoint; swap if we need batches/webhooks.
 *
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO (see .env.example).
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  id: string | null;
}

export class ResendError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ResendError';
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send one transactional email with retry (3 attempts, exponential backoff).
 * Retries on network errors and 5xx; 4xx (bad key/validation) fails fast.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new ResendError('Resend not configured: missing RESEND_API_KEY or RESEND_FROM_EMAIL');
  }
  if (!input.to || !input.subject || !input.html) {
    throw new ResendError('Invalid email input: to, subject and html are required');
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          reply_to: process.env.RESEND_REPLY_TO,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { id: data.id ?? null };
      }

      // 4xx = caller error (bad key, invalid address). Do not retry.
      if (res.status >= 400 && res.status < 500) {
        const body = await res.text();
        throw new ResendError(`Resend rejected request (${res.status}): ${body}`, res.status);
      }

      lastError = new ResendError(`Resend server error ${res.status}`, res.status);
    } catch (err) {
      if (err instanceof ResendError && err.status >= 400 && err.status < 500) throw err;
      lastError = err;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
  }

  throw lastError instanceof Error ? lastError : new ResendError('Resend failed after retries');
}
