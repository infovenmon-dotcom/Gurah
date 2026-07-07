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
  politica?: string; // texto de política de cancelación (opcional)
}): string {
  const garantiaNota = `
    <div style="background:#f6f1e8;border:1px solid #e4dccd;border-radius:10px;padding:14px 16px;margin:16px 0;color:#3a382f;font-size:14px">
      <strong>Sin pago ahora.</strong> Tu tarjeta queda solo como garantía. El importe se cobra el día de tu llegada.
      ${opts.politica ? `<br><span style="color:#6f6a5e;font-size:13px">${escapeHtml(opts.politica)}</span>` : ''}
    </div>`;
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#1a1a1a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <h1 style="color:#46554a;font-size:22px">Reserva confirmada · GURAH</h1>
    <p>Hola ${escapeHtml(opts.nombre)}, tu reserva en <strong>${escapeHtml(opts.apartamento)}</strong> está confirmada.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#666">Localizador</td><td style="text-align:right"><strong>${opts.bookingId}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666">Entrada</td><td style="text-align:right">${opts.entrada}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Salida</td><td style="text-align:right">${opts.salida}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Noches</td><td style="text-align:right">${opts.noches}</td></tr>
      <tr><td style="padding:6px 0;color:#666;border-top:1px solid #eee">Total (se cobra a la llegada)</td><td style="text-align:right;border-top:1px solid #eee"><strong>${opts.total.toFixed(2)} €</strong></td></tr>
    </table>
    ${garantiaNota}
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

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

/**
 * Factura en HTML con la marca GURAH — sirve tanto para imprimir/PDF como para
 * enviarla por email al cliente. `emisor` son los datos fiscales del alojamiento
 * (pendientes de cliente en producción). Incluye el identificador TicketBAI si existe.
 */
export function invoiceHtml(opts: {
  id: string;
  fecha: string;
  cliente: { nombre: string; email?: string; nif?: string };
  concepto: string;
  base: number;
  iva: number;
  ivaPct: number;
  total: number;
  apartamento?: string;
  entrada?: string;
  salida?: string;
  tbaiId?: string;
  estado?: string;
  emisor?: { nombre?: string; nif?: string; direccion?: string };
}): string {
  const em = opts.emisor || {};
  const fecha = (opts.fecha || '').slice(0, 10);
  const estadoPill = opts.estado
    ? `<span style="font-size:12px;padding:3px 10px;border-radius:20px;background:${opts.estado === 'cobrada' ? '#d8f0e6;color:#46554a' : '#fff2cc;color:#8a6d00'}">${escapeHtml(opts.estado === 'cobrada' ? 'Cobrada' : 'Pendiente')}</span>`
    : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Factura ${escapeHtml(opts.id)} · GURAH</title>
  <style>
    @media print{@page{margin:16mm}.noprint{display:none!important}}
    body{font-family:Georgia,'Times New Roman',serif;color:#23221e;margin:0;background:#fff}
    .doc{max-width:640px;margin:0 auto;padding:34px 30px}
    .sans{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #46554a;padding-bottom:16px}
    .brand{letter-spacing:.22em;font-size:24px;color:#46554a}
    .brand small{display:block;font-family:system-ui,sans-serif;font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#8a8478;margin-top:4px}
    .facno{text-align:right;font-family:system-ui,sans-serif}
    .facno b{font-size:18px;color:#46554a}
    .facno span{display:block;font-size:12px;color:#8a8478}
    .cols{display:flex;justify-content:space-between;gap:20px;margin:22px 0;font-family:system-ui,sans-serif;font-size:13px}
    .cols .lbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a8478;margin-bottom:3px}
    table{width:100%;border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;margin-top:8px}
    td,th{padding:9px 6px;border-bottom:1px solid #e4dccd;text-align:left}
    th{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8478}
    .r{text-align:right}
    .tot td{border:0;padding:5px 6px}
    .tot .g{font-size:18px;color:#46554a;font-weight:700}
    .tbai{margin-top:22px;padding:12px 14px;background:#f6f1e8;border:1px solid #e4dccd;border-radius:10px;font-family:system-ui,sans-serif;font-size:11px;color:#6f6a5e;word-break:break-all}
    .foot{margin-top:26px;font-family:system-ui,sans-serif;font-size:11px;color:#8a8478;text-align:center}
    .btnbar{max-width:640px;margin:14px auto 0;padding:0 30px;text-align:right}
    .btnbar button{font-family:system-ui,sans-serif;background:#46554a;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer}
  </style></head><body>
  <div class="btnbar noprint"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="doc">
    <div class="top">
      <div class="brand">GURAH<small>Boutique Apartments</small></div>
      <div class="facno"><b>Factura ${escapeHtml(opts.id)}</b><span>Fecha: ${escapeHtml(fecha)}</span>${estadoPill}</div>
    </div>
    <div class="cols">
      <div>
        <div class="lbl">Emisor</div>
        <div><strong>${escapeHtml(em.nombre || 'GURAH Boutique Apartments')}</strong><br>
        ${escapeHtml(em.nif || '[NIF PENDIENTE CLIENTE]')}<br>${escapeHtml(em.direccion || 'Bakio, Bizkaia')}</div>
      </div>
      <div>
        <div class="lbl">Cliente</div>
        <div><strong>${escapeHtml(opts.cliente.nombre)}</strong><br>
        ${opts.cliente.nif ? escapeHtml(opts.cliente.nif) + '<br>' : ''}${escapeHtml(opts.cliente.email || '')}</div>
      </div>
    </div>
    <table>
      <tr><th>Concepto</th><th class="r">Importe</th></tr>
      <tr><td>${escapeHtml(opts.concepto)}${opts.entrada && opts.salida ? `<br><span style="color:#8a8478;font-size:12px">${escapeHtml(opts.entrada)} → ${escapeHtml(opts.salida)}${opts.apartamento ? ' · ' + escapeHtml(opts.apartamento) : ''}</span>` : ''}</td><td class="r">${eur(opts.base)}</td></tr>
    </table>
    <table class="tot" style="margin-top:6px">
      <tr><td class="r" style="color:#8a8478">Base imponible</td><td class="r" style="width:120px">${eur(opts.base)}</td></tr>
      <tr><td class="r" style="color:#8a8478">IVA (${opts.ivaPct}%)</td><td class="r">${eur(opts.iva)}</td></tr>
      <tr><td class="r g">TOTAL</td><td class="r g">${eur(opts.total)}</td></tr>
    </table>
    <div class="tbai">
      <strong>TicketBAI · Batuz</strong> — ${opts.tbaiId ? escapeHtml(opts.tbaiId) : 'Identificador pendiente (se genera al firmar con el certificado en producción).'}
    </div>
    <div class="foot">GURAH Boutique Apartments · Bakio, Bizkaia · Un proyecto de Venmon</div>
  </div>
  </body></html>`;
}

/** Envoltorio de email para enviar la factura al cliente (cuerpo + factura embebida). */
export function invoiceEmailHtml(opts: Parameters<typeof invoiceHtml>[0]): string {
  return invoiceHtml(opts);
}
