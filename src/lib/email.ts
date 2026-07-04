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
    <p style="color:#666;font-size:13px">GURAH Boutique Apartments · Bakio, Bizkaia · a 3 km de San Juan de Gaztelugatxe.</p>
  </div></body></html>`;
}
