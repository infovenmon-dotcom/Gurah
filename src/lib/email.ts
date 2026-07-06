/**
 * email.ts — Envío de correo transaccional vía Brevo (Sendinblue).
 *
 * En modo demo (sin BREVO_API_KEY) no envía: registra el correo y lo devuelve para
 * poder mostrarlo en pantalla al cliente. Adaptado de Kirana (marca GURAH).
 */

const BREVO_API_KEY = (typeof process !== 'undefined' && process.env?.BREVO_API_KEY) || '';
export const EMAIL_FROM =
  (typeof process !== 'undefined' && process.env?.EMAIL_FROM) || 'reservas@gurah.com';
export const EMAIL_FROM_NAME = 'GURAH Boutique Apartments';
export const ADMIN_EMAIL =
  (typeof process !== 'undefined' && process.env?.ADMIN_EMAIL) || 'info.venmon@gmail.com';

export interface Mail {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface MailResult {
  sent: boolean;
  demo: boolean;
  info?: string;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  if (!BREVO_API_KEY) {
    return { sent: false, demo: true, info: `Modo demo: correo a ${mail.to} no enviado (sin BREVO_API_KEY).` };
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
        to: [{ email: mail.to }],
        replyTo: mail.replyTo ? { email: mail.replyTo } : undefined,
        subject: mail.subject,
        htmlContent: mail.html,
      }),
    });
    if (!res.ok) return { sent: false, demo: false, info: `Brevo error ${res.status}` };
    return { sent: true, demo: false };
  } catch (err) {
    return { sent: false, demo: false, info: `Error de red: ${(err as Error).message}` };
  }
}

/** Plantilla de confirmación de reserva. */
export function bookingEmailHtml(opts: {
  nombre: string;
  apartamento: string;
  entrada: string;
  salida: string;
  noches: number;
  total: number;
  bookingId: string;
}): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#1a1a1a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <h1 style="color:#0e5c4a;font-size:22px">Reserva confirmada · GURAH</h1>
    <p>Hola ${opts.nombre}, tu reserva en <strong>${opts.apartamento}</strong> está confirmada.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#666">Localizador</td><td style="text-align:right"><strong>${opts.bookingId}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666">Entrada</td><td style="text-align:right">${opts.entrada}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Salida</td><td style="text-align:right">${opts.salida}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Noches</td><td style="text-align:right">${opts.noches}</td></tr>
      <tr><td style="padding:6px 0;color:#666;border-top:1px solid #eee">Total</td><td style="text-align:right;border-top:1px solid #eee"><strong>${opts.total.toFixed(2)} €</strong></td></tr>
    </table>
    <p style="color:#666;font-size:13px">GURAH Boutique Apartments · Bakio, Bizkaia · a 10 min de San Juan de Gaztelugatxe.</p>
  </div></body></html>`;
}

/**
 * Plantilla de campaña de email marketing (newsletter/oferta), con la marca GURAH.
 * `cuerpo` es texto plano (ya traducido al idioma del huésped); se respetan los
 * saltos de línea como párrafos. `despedida` va traducida por el llamante.
 */
export function marketingEmailHtml(opts: {
  titulo: string;
  cuerpo: string;
  ctaTexto?: string;
  ctaUrl?: string;
  despedida?: string;
}): string {
  const parrafos = opts.cuerpo
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(p)}</p>`)
    .join('');
  const cta =
    opts.ctaTexto && opts.ctaUrl
      ? `<p style="margin:22px 0"><a href="${opts.ctaUrl}" style="background:#46554a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block">${escapeHtml(opts.ctaTexto)}</a></p>`
      : '';
  return `<!doctype html><html><body style="font-family:Georgia,'Times New Roman',serif;color:#23221e;background:#f6f1e8;margin:0">
  <div style="max-width:560px;margin:0 auto;padding:32px 26px">
    <div style="text-align:center;letter-spacing:.24em;font-size:22px;color:#46554a;margin-bottom:6px">GURAH</div>
    <div style="text-align:center;font-family:system-ui,sans-serif;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#8a8375;margin-bottom:26px">Boutique Apartments · Bakio</div>
    <div style="background:#fffdf8;border:1px solid #e4dccd;border-radius:14px;padding:26px">
      <h1 style="font-size:22px;color:#46554a;margin:0 0 16px">${escapeHtml(opts.titulo)}</h1>
      <div style="font-family:system-ui,sans-serif;font-size:15px;color:#3a382f">${parrafos}${cta}</div>
    </div>
    <p style="font-family:system-ui,sans-serif;color:#8a8375;font-size:12px;text-align:center;margin-top:22px">
      ${escapeHtml(opts.despedida || 'GURAH Boutique Apartments · Bakio, Bizkaia')}
    </p>
  </div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}
