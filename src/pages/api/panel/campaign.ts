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

// Traducciones de ejemplo de la campaña por defecto, para que la previsualización
// cambie de verdad al elegir idioma en modo demostración (sin clave de IA).
// Al activar la IA, cualquier texto se traduce automáticamente.
const DEMO_DEFAULT_ASUNTO = 'Vuelve a GURAH esta temporada — 10% de descuento reservando directo';
const DEMO_DEFAULT_CUERPO =
  'Hola,\n\nGracias por haberte alojado con nosotros en Bakio. Nos encantaría volver a recibirte.\n\nReservando directamente en nuestra web tienes un 10% de descuento frente a las plataformas, mejores condiciones y trato directo con Maialen.\n\nTe esperamos junto al mar.';
const DEMO_TRANS: Record<string, { asunto: string; cuerpo: string }> = {
  fr: {
    asunto: 'Revenez à GURAH cette saison — 10 % de réduction en réservant en direct',
    cuerpo:
      'Bonjour,\n\nMerci d’avoir séjourné chez nous à Bakio. Nous serions ravis de vous accueillir à nouveau.\n\nEn réservant directement sur notre site, vous bénéficiez de 10 % de réduction par rapport aux plateformes, de meilleures conditions et d’un contact direct avec Maialen.\n\nNous vous attendons au bord de la mer.',
  },
  en: {
    asunto: 'Come back to GURAH this season — 10% off when you book direct',
    cuerpo:
      'Hello,\n\nThank you for staying with us in Bakio. We’d love to welcome you back.\n\nBy booking directly on our website you get 10% off compared to the platforms, better conditions and a direct relationship with Maialen.\n\nWe’ll be waiting for you by the sea.',
  },
  de: {
    asunto: 'Komm diese Saison zurück zu GURAH — 10 % Rabatt bei Direktbuchung',
    cuerpo:
      'Hallo,\n\nvielen Dank für deinen Aufenthalt bei uns in Bakio. Wir würden uns freuen, dich wieder begrüßen zu dürfen.\n\nWenn du direkt auf unserer Website buchst, erhältst du 10 % Rabatt gegenüber den Plattformen, bessere Konditionen und persönlichen Kontakt mit Maialen.\n\nWir erwarten dich am Meer.',
  },
  it: {
    asunto: 'Torna a GURAH questa stagione — 10% di sconto prenotando diretto',
    cuerpo:
      'Ciao,\n\ngrazie per aver soggiornato da noi a Bakio. Ci farebbe piacere riaverti come ospite.\n\nPrenotando direttamente sul nostro sito hai il 10% di sconto rispetto alle piattaforme, condizioni migliori e un rapporto diretto con Maialen.\n\nTi aspettiamo in riva al mare.',
  },
  nl: {
    asunto: 'Kom dit seizoen terug naar GURAH — 10% korting bij direct boeken',
    cuerpo:
      'Hallo,\n\nbedankt voor je verblijf bij ons in Bakio. We verwelkomen je graag opnieuw.\n\nAls je rechtstreeks via onze website boekt, krijg je 10% korting ten opzichte van de platforms, betere voorwaarden en direct contact met Maialen.\n\nWe verwachten je aan zee.',
  },
  be: {
    asunto: 'Kom dit seizoen terug naar GURAH — 10% korting bij rechtstreeks boeken',
    cuerpo:
      'Hallo,\n\nbedankt voor je verblijf bij ons in Bakio. We heten je graag opnieuw welkom.\n\nAls je rechtstreeks via onze website boekt, krijg je 10% korting ten opzichte van de platforms, betere voorwaarden en direct contact met Maialen.\n\nWe verwachten je aan zee.',
  },
  no: {
    asunto: 'Kom tilbake til GURAH denne sesongen — 10 % rabatt ved direkte booking',
    cuerpo:
      'Hei,\n\ntakk for at du bodde hos oss i Bakio. Vi vil gjerne ønske deg velkommen tilbake.\n\nNår du booker direkte på nettsiden vår, får du 10 % rabatt sammenlignet med plattformene, bedre betingelser og direkte kontakt med Maialen.\n\nVi venter på deg ved havet.',
  },
  da: {
    asunto: 'Kom tilbage til GURAH denne sæson — 10 % rabat ved direkte booking',
    cuerpo:
      'Hej,\n\ntak fordi du boede hos os i Bakio. Vi vil meget gerne byde dig velkommen igen.\n\nNår du booker direkte på vores hjemmeside, får du 10 % rabat i forhold til platformene, bedre vilkår og direkte kontakt med Maialen.\n\nVi venter på dig ved havet.',
  },
  eu: {
    asunto: 'Itzuli GURAHera denboraldi honetan — %10eko deskontua zuzenean erreserbatuz',
    cuerpo:
      'Kaixo,\n\neskerrik asko Bakion gurekin ostatu hartzeagatik. Berriz hartzea gustatuko litzaiguke.\n\nGure webgunean zuzenean erreserbatuz, %10eko deskontua duzu plataformekin alderatuta, baldintza hobeak eta Maialenekin harreman zuzena.\n\nItsasertzean itxarongo dizugu.',
  },
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
    const { asunto: a, cuerpo: c, demo, traducido } = await localizar(asunto, cuerpo, cod);
    return json({ ok: true, idioma: cod, asunto: a, cuerpo: c, demo, traducido });
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
  if (idioma === 'es') return { asunto, cuerpo, demo: false, traducido: false };
  const nombre = LANG[idioma]?.nombre || 'inglés';
  const [ta, tc] = await Promise.all([translateTo(asunto, nombre), translateTo(cuerpo, nombre)]);
  const demo = ta.demo || tc.demo;
  if (demo) {
    // Sin clave de IA (demostración): si el texto es la campaña de ejemplo, se usa
    // una traducción de ejemplo para que la previsualización cambie de idioma.
    // Con cualquier otro texto, se muestra el original (al activar la IA se traduce solo).
    const esDefault =
      asunto.trim() === DEMO_DEFAULT_ASUNTO && cuerpo.trim() === DEMO_DEFAULT_CUERPO;
    const t = DEMO_TRANS[idioma];
    if (esDefault && t) return { asunto: t.asunto, cuerpo: t.cuerpo, demo: true, traducido: true };
    return { asunto, cuerpo, demo: true, traducido: false };
  }
  const asuntoT = ta.error || !ta.text ? asunto : ta.text;
  const cuerpoT = tc.error || !tc.text ? cuerpo : tc.text;
  return { asunto: asuntoT, cuerpo: cuerpoT, demo: false, traducido: !ta.error && !!ta.text };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
