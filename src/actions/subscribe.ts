'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { ResendError, sendEmail } from '@/lib/resend';
import { assertRateLimit } from '@/lib/server-action-rate-limit';

export type SubscribeState = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';

/**
 * Newsletter signup — double opt-in.
 * Insert as 'pending', send confirm link; user confirms via /api/subscribe/confirm?token=...
 * Idempotent: existing pending → re-send confirm; active → "already subscribed";
 * unsubscribed/pending → resend confirm with existing token.
 */
export async function subscribeAction(
  _prev: SubscribeState | null,
  formData: FormData
): Promise<SubscribeState> {
  await assertRateLimit('subscribe', null, 5, 60_000);

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 255) {
    return { ok: false, message: 'E-mail inválido.' };
  }

  try {
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      if (!row) return { ok: false, message: 'Erro ao processar inscrição.' };
      if (row.status === 'active') {
        return { ok: true, message: 'Você já está inscrito! 🎮' };
      }
      await sendConfirmEmail({ email, token: row.confirmToken });
      return {
        ok: true,
        message: 'Link de confirmação reenviado. Confira sua caixa de entrada.',
      };
    }

    const [inserted] = await db.insert(newsletterSubscribers).values({ email }).returning({
      id: newsletterSubscribers.id,
      confirmToken: newsletterSubscribers.confirmToken,
    });

    if (!inserted) {
      return { ok: false, message: 'Erro ao processar inscrição. Tente novamente.' };
    }

    await sendConfirmEmail({ email, token: inserted.confirmToken });
    return { ok: true, message: 'Inscrição registrada! Confirme no seu e-mail. 📬' };
  } catch (err) {
    if (err instanceof ResendError) {
      console.error(
        JSON.stringify({ level: 'error', cron: 'subscribe-action', error: err.message })
      );
      return { ok: false, message: 'Não foi possível enviar o e-mail agora. Tente mais tarde.' };
    }
    throw err;
  }
}

async function sendConfirmEmail(args: { email: string; token: string }): Promise<void> {
  const confirmUrl = `${SITE_URL}/api/subscribe/confirm?token=${args.token}`;
  const html = `
    <p>Confirma sua inscrição no GameDeals?</p>
    <p style="margin:24px 0">
      <a href="${confirmUrl}" style="display:inline-block;background:#22d3ee;color:#0f172a;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Confirmar inscrição</a>
    </p>
    <p style="color:#888;font-size:12px">Se você não solicitou isso, ignore este e-mail.</p>
  `;
  await sendEmail({ to: args.email, subject: 'Confirma sua inscrição — GameDeals 🎮', html });
}
