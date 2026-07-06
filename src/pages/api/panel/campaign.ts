/**
 * Panel · Email marketing (protegido). POST /api/panel/campaign
 *
 *   { asunto, cuerpo, ... , preview:'fr' }  → devuelve la campaña traducida a ese idioma
 *   { asunto, cuerpo, ... , enviar:true }    → envía a TODA la lista, cada huésped en
 *                                              el idioma de SU reserva (traducción por IA)
 *
 * En modo demo (sin BREVO_API_KEY) no se envía nada real: se devuelve un resumen
 * simulado por idioma para enseñar el flujo (como el resto del panel).
 */

import type { APIRoute } from 'astro';
import { getBookings } from '../../../lib/bookings';
import { isDemoAuth } from '../../../lib/auth';
import { demoBookings } from '../../../data/panel-demo';
import { translateTo } from '../../../lib/claude';
import { sendMail, marketingEmailHtml } from '../../../lib/email';

export const prerender = false;

// Nombre del idioma (en español) + saludo/despedida por defecto para la campaña.
const LANG: Record<string, { nombre: string; despedida: string }> = {
  es: { nombre: 'español', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  eu: { nombre: 'euskera', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  en: { nombre: 'inglés', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  fr: { nombre: 'francés', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  de: { nombre: 'alemán', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  it: { nombre: 'italiano', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  nl: { nombre: 'neerlandés', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  be: { nombre: 'neerlandés (Bélgica)', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  no: { nombre: 'noruego', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
  da: { nombre: 'danés', despedida: 'GURAH Boutique Apartments · Bakio, Bizkaia' },
};

// Si una reserva antigua no guardó idioma, se infiere por el dominio del email.
const TLD_LANG: Record<string, string> = {
  fr: 'fr', be: 'be', nl: 'nl', de: 'de', at: 'de', it: 'it',
  no: 'no', dk: 'da', es: 'es', eus: 'eu', uk: 'en', com: 'en', us: 'en',
};
function inferLang(email: string): string {
  const tld = email.split('.').pop()?.toLowerCase() || '';
  return TLD_LANG[tld] || 'en';
}

interface Recipient { email: string; nombre: string; idioma: string }

async function getRecipients(): Promise<Recipient[]> {
  let bookings = await getBookings();
  if (isDemoAuth() && !bookings.length) bookings = demoBookings as any;
  const map = new Map<string, Recipient>();
  for (const b of bookings as any[]) {
    const email = b.huesped?.email;
    if (!email) continue;
    map.set(email, {
      email,
      nombre: b.huesped?.nombre || '',
      // idioma guardado en la reserva, o inferido por el dominio del email (datos antiguos)
      idioma: normLang(b.huesped?.idioma || inferLang(email)),
    });
  }
  return [...map.values()];
}

function normLang(code: string): string {
  const c = (code || 'es').toLowerCase();
  if (LANG[c]) return c;
  const base = c.slice(0, 2);
  return LANG[base] ? base : 'en';
}

interface Body {
  asunto?: string;
  cuerpo?: string;
  ctaTexto?: string;
  ctaUrl?: string;
  preview?: string; // código de idioma para previsualizar
  enviar?: boolean;
  soloIdiomas?: string[]; // opcional: limitar a estos idiomas
}

export const POST: APIRoute = async ({ request }) => {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const asunto = (body.asunto || '').trim();
  const cuerpo = (body.cuerpo || '').trim();
  if (!asunto || !cuerpo) return json({ ok: false, error: 'Faltan asunto y cuerpo.' }, 400);

  // --- Previsualización en un idioma concreto ---
  if (body.preview) {
    const cod = normLang(body.preview);
    const { asunto: a, cuerpo: c, demo } = await localizar(asunto, cuerpo, cod);
    return json({ ok: true, idioma: cod, asunto: a, cuerpo: c, demo });
  }

  // --- Destinatarios agrupados por idioma ---
  const recipients = await getRecipients();
  const filtro = body.soloIdiomas?.length ? new Set(body.soloIdiomas.map(normLang)) : null;
  const grupos = new Map<string, Recipient[]>();
  for (const r of recipients) {
    if (filtro && !filtro.has(r.idioma)) continue;
    (grupos.get(r.idioma) || grupos.set(r.idioma, []).get(r.idioma)!).push(r);
  }

  // --- Solo resumen de la lista (sin enviar): contactos por idioma ---
  if (!body.enviar) {
    const porIdioma = [...grupos.entries()]
      .map(([idioma, rs]) => ({ idioma, nombre: LANG[idioma]?.nombre || idioma, total: rs.length }))
      .sort((a, b) => b.total - a.total);
    return json({ ok: true, total: recipients.length, porIdioma });
  }

  // --- Envío real: traducir una vez por idioma y enviar a cada huésped ---
  const resumen: Array<{ idioma: string; nombre: string; total: number; enviados: number; demo: boolean; muestraAsunto: string }> = [];
  let demoGlobal = false;
  for (const [idioma, rs] of grupos) {
    const { asunto: a, cuerpo: c, demo } = await localizar(asunto, cuerpo, idioma);
    demoGlobal = demoGlobal || demo;
    const html = marketingEmailHtml({
      titulo: a,
      cuerpo: c,
      ctaTexto: body.ctaTexto,
      ctaUrl: body.ctaUrl,
      despedida: LANG[idioma]?.despedida,
    });
    let enviados = 0;
    for (const r of rs) {
      const res = await sendMail({ to: r.email, subject: a, html });
      if (res.sent || res.demo) enviados++;
    }
    resumen.push({ idioma, nombre: LANG[idioma]?.nombre || idioma, total: rs.length, enviados, demo, muestraAsunto: a });
  }
  resumen.sort((x, y) => y.total - x.total);
  return json({
    ok: true,
    enviado: true,
    demo: demoGlobal,
    totalContactos: recipients.length,
    idiomas: resumen.length,
    resumen,
  });
};

/** Traduce asunto+cuerpo al idioma dado (el español no se traduce). */
async function localizar(asunto: string, cuerpo: string, idioma: string) {
  if (idioma === 'es') return { asunto, cuerpo, demo: false };
  const nombre = LANG[idioma]?.nombre || 'inglés';
  const [ta, tc] = await Promise.all([translateTo(asunto, nombre), translateTo(cuerpo, nombre)]);
  const demo = ta.demo || tc.demo;
  // Sin ANTHROPIC_API_KEY (demo) la IA no traduce: se muestra el texto original
  // y el panel avisa de que en producción se traduce solo. Con clave real, se usa
  // la traducción de Claude al idioma del huésped.
  if (demo) return { asunto, cuerpo, demo: true };
  const asuntoT = ta.error || !ta.text ? asunto : ta.text;
  const cuerpoT = tc.error || !tc.text ? cuerpo : tc.text;
  return { asunto: asuntoT, cuerpo: cuerpoT, demo: false };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
