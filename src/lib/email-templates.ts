/**
 * Email HTML templates — plain string builders, no template engine.
 * ponytail: react-email adds heavy deps for 2 templates; inline strings scale fine here.
 */

export interface WelcomeEmailData {
  email: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamedeals.com.br';

function layout(title: string, bodyHtml: string, unsubscribeToken?: string): string {
  const unsub = unsubscribeToken
    ? `<p style="color:#888;font-size:12px;margin-top:24px">
        <a href="${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a>
      </p>`
    : '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1e293b;border-radius:12px;overflow:hidden">
        <tr><td style="padding:32px 32px 16px;text-align:center">
          <span style="font-size:24px;font-weight:700;color:#22d3ee">🎮 GameDeals</span>
        </td></tr>
        <tr><td style="padding:0 32px;font-size:18px;font-weight:600;color:#f1f5f9">${title}</td></tr>
        <tr><td style="padding:8px 32px 32px;font-size:14px;line-height:1.6;color:#cbd5e1">${bodyHtml}</td></tr>
        ${unsub}
        <tr><td style="padding:24px;border-top:1px solid #334155;font-size:11px;color:#64748b;text-align:center">
          © ${new Date().getFullYear()} GameDeals — Melhores promoções de jogos, todo dia.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeEmail(_data: WelcomeEmailData): { subject: string; html: string } {
  return {
    subject: 'Bem-vindo ao GameDeals! 🎮',
    html: layout(
      'Você está dentro!',
      `<p>Olá!</p>
       <p>A partir de agora você recebe as melhores promoções de jogos direto no seu e-mail:</p>
       <ul>
         <li>🔥 Descontos acima de 70%</li>
         <li>🆓 Jogos grátis toda semana</li>
         <li>📉 Alertas de preço no seu jogo favorito</li>
       </ul>
       <p style="margin:24px 0">
         <a href="${SITE_URL}/deals/under-10" style="display:inline-block;background:#22d3ee;color:#0f172a;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Ver deals under R$10 →</a>
       </p>
       <p>Nenhum spam. Cancele quando quiser.</p>`
    ),
  };
}
